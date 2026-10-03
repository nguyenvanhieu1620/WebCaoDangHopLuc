import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { searchSite, SEARCH_MIN_LENGTH, type SearchResultType, type TextPart } from "@/lib/data/search";
import { getLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  // Trang kết quả tìm kiếm không cần Google lập chỉ mục (nội dung trùng các trang gốc).
  robots: { index: false, follow: true },
};

const TEXT = {
  vi: {
    eyebrow: "Tìm kiếm",
    heading: "Bạn đang tìm thông tin gì?",
    placeholder: "VD: điều dưỡng, học phí, hồ sơ, lịch nghỉ…",
    submit: "Tìm",
    all: "Tất cả",
    results: (n: number, q: string) => `${n} kết quả cho “${q}”`,
    tooShort: `Nhập ít nhất ${SEARCH_MIN_LENGTH} ký tự để tìm.`,
    empty: (q: string) => `Không tìm thấy kết quả cho “${q}”.`,
    emptyHint: "Thử từ khoá ngắn hơn, hoặc xem nhanh các mục được quan tâm nhiều:",
    popular: "Gợi ý phổ biến",
  },
  en: {
    eyebrow: "Search",
    heading: "What are you looking for?",
    placeholder: "e.g. nursing, tuition, documents…",
    submit: "Search",
    all: "All",
    results: (n: number, q: string) => `${n} results for “${q}”`,
    tooShort: `Type at least ${SEARCH_MIN_LENGTH} characters.`,
    empty: (q: string) => `No results for “${q}”.`,
    emptyHint: "Try a shorter keyword, or jump to a popular section:",
    popular: "Popular",
  },
};

const TYPE_LABEL: Record<"vi" | "en", Record<SearchResultType, string>> = {
  vi: { program: "Ngành đào tạo", post: "Tin tức", event: "Sự kiện", faculty: "Giảng viên", page: "Trang thông tin", faq: "Hỏi đáp" },
  en: { program: "Programs", post: "News", event: "Events", faculty: "Faculty", page: "Pages", faq: "FAQ" },
};

const TYPE_TONE: Record<SearchResultType, string> = {
  program: "bg-brand-700 text-white",
  post: "bg-brand-100 text-brand-800",
  event: "bg-accent-100 text-accent-700",
  faculty: "bg-brand-50 text-brand-700",
  page: "bg-paper-alt text-ink-soft",
  faq: "bg-accent-50 text-accent-700",
};

const POPULAR = [
  { vi: "Ngành đào tạo", en: "Programs", href: "/nganh-dao-tao" },
  { vi: "Tuyển sinh & học phí", en: "Admissions & tuition", href: "/tuyen-sinh" },
  { vi: "Tra cứu hồ sơ", en: "Application status", href: "/tra-cuu-ket-qua" },
  { vi: "Câu hỏi thường gặp", en: "FAQ", href: "/faq" },
];

function Highlighted({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-accent-100 px-0.5 text-accent-700">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; loai?: string }>;
}) {
  const { q = "", loai } = await searchParams;
  const locale = await getLocale();
  const t = TEXT[locale];
  const query = q.trim().slice(0, 100);
  const results = query.length >= SEARCH_MIN_LENGTH ? await searchSite(query) : [];

  const counts = results.reduce<Partial<Record<SearchResultType, number>>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const activeType = loai && loai in counts ? (loai as SearchResultType) : null;
  const visible = activeType ? results.filter((r) => r.type === activeType) : results;
  const filterHref = (type: SearchResultType | null) =>
    `/tim-kiem?q=${encodeURIComponent(query)}${type ? `&loai=${type}` : ""}`;

  return (
    <>
    <PageHero crumbs={[{ label: t.eyebrow }]} eyebrow={t.eyebrow} title={t.heading}>
      <Form action="/tim-kiem" role="search" className="group relative max-w-3xl">
        <div className="pointer-events-none absolute -inset-1 rounded-[22px] bg-gradient-to-r from-brand-500/30 via-brand-700/20 to-accent-500/30 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100" />
        <div className="relative flex items-center gap-2 rounded-2xl border border-line bg-white/90 p-2 shadow-md2 backdrop-blur">
          <svg className="ml-3 h-5 w-5 shrink-0 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" strokeLinecap="round" />
          </svg>
          <label htmlFor="site-search" className="sr-only">{t.heading}</label>
          <input
            key={query}
            id="site-search"
            type="search"
            name="q"
            defaultValue={query}
            autoFocus={!query}
            maxLength={100}
            placeholder={t.placeholder}
            className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint"
          />
          <button type="submit" className="h-12 shrink-0 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 px-6 text-sm font-bold text-white shadow-red">
            {t.submit}
          </button>
        </div>
      </Form>
    </PageHero>
    <DecorativeSection contentClassName="mx-auto max-w-3xl">

      {query.length > 0 && query.length < SEARCH_MIN_LENGTH && (
        <p className="text-sm text-ink-soft">{t.tooShort}</p>
      )}

      {query.length >= SEARCH_MIN_LENGTH && (
        <div>
          <p className="text-sm text-ink-soft" aria-live="polite">{t.results(results.length, query)}</p>

          {results.length > 0 && (
            <nav aria-label="Lọc kết quả" className="mt-4 flex flex-wrap gap-2">
              <Link
                href={filterHref(null)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                  !activeType ? "bg-brand-900 text-white" : "border border-line bg-white text-ink-soft hover:border-brand-500"
                )}
              >
                {t.all} · {results.length}
              </Link>
              {(Object.keys(counts) as SearchResultType[]).map((type) => (
                <Link
                  key={type}
                  href={filterHref(type)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                    activeType === type ? "bg-brand-900 text-white" : "border border-line bg-white text-ink-soft hover:border-brand-500"
                  )}
                >
                  {TYPE_LABEL[locale][type]} · {counts[type]}
                </Link>
              ))}
            </nav>
          )}

          {results.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-line bg-white p-7 shadow-sm2">
              <p className="font-semibold text-ink">{t.empty(query)}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{t.emptyHint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <Link key={p.href} href={p.href} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50">
                    {p[locale]} →
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <ol className="mt-6 space-y-3.5">
              {visible.map((r, i) => (
                <li key={`${r.type}-${r.href}-${i}`}>
                  <Reveal delay={Math.min(i, 8) * 50}>
                    <Link
                      href={r.href}
                      className="group block rounded-2xl border border-line bg-white/90 p-5 shadow-sm2 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md2"
                    >
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider", TYPE_TONE[r.type])}>
                        {TYPE_LABEL[locale][r.type]}
                      </span>
                      <h2 className="mt-2 font-display text-[19px] font-semibold leading-snug text-brand-900 group-hover:text-brand-700">
                        <Highlighted parts={r.title} />
                      </h2>
                      {r.snippet.length > 0 && (
                        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">
                          <Highlighted parts={r.snippet} />
                        </p>
                      )}
                      <span className="mt-2 block font-mono text-[11px] text-ink-faint">{r.href}</span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {!query && (
        <div>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-faint">{t.popular}</div>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <Link key={p.href} href={p.href} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50">
                {p[locale]} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </DecorativeSection>
    </>
  );
}
