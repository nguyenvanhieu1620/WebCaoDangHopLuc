import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";
import { hasPlaceholder, normalizeSearch } from "@/lib/utils";

export type SearchResultType = "program" | "post" | "event" | "faculty" | "page" | "faq";

/** 1 đoạn chữ; `hit` = khớp từ khoá (tô đậm khi hiển thị). */
export type TextPart = { text: string; hit: boolean };

export type SearchResult = {
  type: SearchResultType;
  href: string;
  title: TextPart[];
  snippet: TextPart[];
  score: number;
};

export const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_LENGTH = 100;
const MAX_RESULTS = 40;

/** Trang tĩnh nào có route công khai — trang không có route thì không đưa vào kết quả. */
function pageHref(slug: string): string | null {
  if (slug.startsWith("cong-khai-")) return `/cong-khai/${slug}`;
  if (["gioi-thieu", "lien-he", "chinh-sach-bao-mat"].includes(slug)) return `/${slug}`;
  return null;
}

/** Bỏ cú pháp Markdown để làm đoạn trích dễ đọc. */
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chuẩn hoá từng ký tự (bỏ dấu, chữ thường) và giữ bảng ánh xạ vị trí về
 * chuỗi gốc — để tìm không dấu nhưng vẫn cắt/tô đậm đúng trên chữ có dấu.
 */
function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const n = text[i]
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d");
    for (const ch of n) {
      norm += ch;
      map.push(i);
    }
  }
  return { norm, map };
}

/** Tách `text` thành các đoạn, đánh dấu đoạn khớp bất kỳ từ khoá nào trong `terms`. */
function highlight(text: string, terms: string[]): TextPart[] {
  const { norm, map } = normalizeWithMap(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    let from = 0;
    let idx: number;
    while (term && (idx = norm.indexOf(term, from)) !== -1) {
      const start = map[idx];
      const end = map[idx + term.length - 1];
      for (let i = start; i <= end; i++) marks[i] = true;
      from = idx + term.length;
    }
  }
  const parts: TextPart[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === marks[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: marks[i] });
  }
  return parts;
}

/** Cắt ~180 ký tự quanh lần khớp đầu tiên trong `body` (hoặc đầu đoạn nếu không khớp trong body). */
function snippetAround(body: string, terms: string[]): TextPart[] {
  if (!body) return [];
  const { norm, map } = normalizeWithMap(body);
  const firstIdx = terms.map((t) => norm.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  const center = firstIdx === undefined ? 0 : map[firstIdx];
  let start = Math.max(0, center - 60);
  let end = Math.min(body.length, start + 180);
  // Cắt theo ranh giới từ — không để đoạn trích bắt đầu/kết thúc giữa chữ.
  if (start > 0) {
    const space = body.indexOf(" ", start);
    if (space !== -1 && space < center) start = space + 1;
  }
  if (end < body.length) {
    const space = body.lastIndexOf(" ", end);
    if (space > center) end = space;
  }
  const cut = `${start > 0 ? "… " : ""}${body.slice(start, end).trim()}${end < body.length ? " …" : ""}`;
  return highlight(cut, terms);
}

type Candidate = { type: SearchResultType; href: string; title: string; body: string; boost?: number };

/**
 * Tìm kiếm toàn site cho /tim-kiem — ngành, bài viết đã đăng, sự kiện, giảng
 * viên, trang tĩnh có route công khai và FAQ. Tìm không dấu, mọi từ khoá đều
 * phải có (AND). Khớp ở tiêu đề xếp trên khớp ở nội dung. Lấy hết rồi lọc
 * trong JS (quy mô 1 trường, vài trăm bản ghi) — khi lên PostgreSQL có thể
 * đổi sang full-text search ngay tại file này mà không phải sửa trang.
 */
export async function searchSite(rawQuery: string): Promise<SearchResult[]> {
  const query = normalizeSearch(rawQuery.slice(0, SEARCH_MAX_LENGTH));
  if (query.length < SEARCH_MIN_LENGTH) return [];
  const terms = [...new Set(query.split(" ").filter(Boolean))];

  const [locale, programs, posts, events, faculty, pages, faqs] = await Promise.all([
    getLocale(),
    db.query.programs.findMany(),
    db.query.posts.findMany({ where: eq(schema.posts.status, "published") }),
    db.query.events.findMany(),
    db.query.faculty.findMany(),
    db.query.pages.findMany(),
    db.query.faqs.findMany(),
  ]);
  const L = (vi: string | null, en: string | null) => (vi ? pickLocale(vi, en, locale) : "");

  const candidates: Candidate[] = [
    ...programs.map((p) => ({
      type: "program" as const,
      href: `/nganh-dao-tao/${p.slug}`,
      title: L(p.name, p.nameEn),
      body: stripMarkdown(`${p.code} ${L(p.summary, p.summaryEn)} ${L(p.content, p.contentEn)}`),
      boost: 1,
    })),
    ...posts.map((p) => ({
      type: "post" as const,
      href: `/tin-tuc/${p.slug}`,
      title: L(p.title, p.titleEn),
      body: stripMarkdown(`${L(p.excerpt, p.excerptEn)} ${L(p.content, p.contentEn)}`),
    })),
    ...events
      .filter((e) => e.slug)
      .map((e) => ({
        type: "event" as const,
        href: `/su-kien/${e.slug}`,
        title: L(e.title, e.titleEn),
        body: stripMarkdown(`${L(e.location, e.locationEn)} ${L(e.description, e.descriptionEn)}`),
      })),
    ...faculty
      .filter((f) => f.slug)
      .map((f) => ({
        type: "faculty" as const,
        href: `/doi-ngu-giang-vien/${f.slug}`,
        title: [L(f.academicRank, f.academicRankEn), L(f.degree, f.degreeEn), f.name].filter(Boolean).join(" "),
        body: stripMarkdown(`${L(f.role, f.roleEn)} ${L(f.specialty, f.specialtyEn)} ${L(f.bio, f.bioEn)}`),
      })),
    ...pages.flatMap((p) => {
      const href = pageHref(p.slug);
      const content = L(p.content, p.contentEn);
      // Trang còn ghi chú "[Trường điền…]" vẫn tìm được, nhưng đoạn trích bỏ phần placeholder.
      const body = stripMarkdown(hasPlaceholder(content) ? content.replace(/\[[^\]]{2,}\](?!\()/g, " ") : content);
      return href ? [{ type: "page" as const, href, title: L(p.title, p.titleEn), body }] : [];
    }),
    ...faqs.map((f) => ({
      type: "faq" as const,
      href: "/faq",
      title: L(f.question, f.questionEn),
      body: stripMarkdown(L(f.answer, f.answerEn)),
    })),
  ];

  const results: SearchResult[] = [];
  for (const c of candidates) {
    const normTitle = normalizeSearch(c.title);
    const normBody = normalizeSearch(c.body);
    if (!terms.every((t) => normTitle.includes(t) || normBody.includes(t))) continue;
    const titleHits = terms.filter((t) => normTitle.includes(t)).length;
    // Khớp nguyên cụm từ ("ho so" → "hồ sơ") xếp trên khớp rời rạc từng âm tiết.
    const phrase = terms.length > 1 ? (normTitle.includes(query) ? 12 : normBody.includes(query) ? 4 : 0) : 0;
    const score = titleHits * 10 + phrase + (normTitle.startsWith(query) ? 5 : 0) + (c.boost ?? 0);
    results.push({
      type: c.type,
      href: c.href,
      title: highlight(c.title, terms),
      snippet: snippetAround(c.body, terms),
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
}
