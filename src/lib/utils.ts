/**
 * Gộp className có điều kiện, bỏ qua giá trị falsy.
 * Dùng thay cho clsx để không thêm dependency ngoài.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Tạo slug từ tiêu đề tiếng Việt — bỏ dấu, thay khoảng trắng bằng gạch ngang. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Phát hiện ghi chú nội bộ dạng "[Trường điền: ...]"/"[điền số liệu]" chưa
 * được thay bằng nội dung thật. Bỏ qua link Markdown `[chữ](url)` (ngoặc
 * vuông theo sau là "(") để không báo nhầm.
 */
const PLACEHOLDER_PATTERN = /\[[^\]]{2,}\](?!\()/;
export function hasPlaceholder(content: string | null | undefined): boolean {
  return !!content && PLACEHOLDER_PATTERN.test(content);
}

/**
 * Tách ID video từ link YouTube admin dán vào (watch?v=, youtu.be/, /embed/,
 * /shorts/, /live/) — dùng để phát ngay trong lightbox qua youtube-nocookie.com.
 * Link không phải YouTube (Facebook, Vimeo…) trả `null` → lightbox mở tab mới.
 */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = parsed.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, value] = parsed.pathname.split("/");
    id = kind === "watch" ? parsed.searchParams.get("v") : ["embed", "shorts", "live"].includes(kind) ? value ?? null : null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/**
 * Đường dẫn công khai của 1 trang tĩnh (bảng `pages`) theo slug — `null` nếu trang
 * đó không có route trên web (chỉ là nội dung dùng nội bộ). Dùng chung cho tìm
 * kiếm toàn site và admin "Banner trang con".
 */
export function staticPageHref(slug: string): string | null {
  if (slug.startsWith("cong-khai-")) return `/cong-khai/${slug}`;
  if (["gioi-thieu", "lien-he", "chinh-sach-bao-mat"].includes(slug)) return `/${slug}`;
  return null;
}

/**
 * Chuẩn hoá link ngoài admin dán vào (Facebook, Zalo, YouTube, LMS…): bỏ khoảng trắng và dấu
 * "#" lỡ dính ở đầu ("#https://facebook.com/…" — từng xảy ra thật vì ô nhập điền sẵn "#"), tự
 * thêm "https://" khi thiếu ("facebook.com/abc"). Chỉ nhận http(s) có tên miền — giá trị trống,
 * "#", "javascript:…", chữ không phải link đều trả `null`.
 */
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  let value = (raw ?? "").trim().replace(/^#+/, "").trim();
  if (!value) return null;
  if (value.startsWith("//")) value = `https:${value}`;
  else if (!/^[a-z][a-z\d+.-]*:/i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Tên miền phải có dấu chấm NHƯ ADMIN GÕ — không xét `url.hostname`, vì URL tự hiểu "123"
  // thành địa chỉ IP 0.0.0.123.
  const typedHost = value.replace(/^https?:\/\//i, "").split(/[/?#:]/)[0];
  if (!typedHost.includes(".")) return null;
  return url.href;
}

/** Như `normalizeExternalUrl`, thêm: admin gõ số điện thoại Zalo ("0912 345 678") → "https://zalo.me/0912345678". */
export function normalizeZaloUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim().replace(/^#+/, "").trim();
  if (/^\+?[\d\s.-]{9,15}$/.test(value)) return `https://zalo.me/${value.replace(/\D/g, "")}`;
  return normalizeExternalUrl(value);
}

/** Chuẩn hoá chuỗi để tìm kiếm không phân biệt hoa/thường và dấu tiếng Việt ("Điều dưỡng" ~ "dieu duong"). */
export function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/** Múi giờ Việt Nam cố định UTC+7 (không có giờ mùa hè) — dùng xuyên suốt để ngày/giờ hiển thị không phụ thuộc múi giờ máy chủ đang chạy. */
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET_MINUTES = 7 * 60;

/** Định dạng ngày kiểu Việt Nam (dd/mm/yyyy) từ chuỗi ISO — trả về "" nếu rỗng. */
export function formatVNDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { timeZone: VN_TIME_ZONE });
}

/** Định dạng ngày giờ kiểu Việt Nam (dd/mm/yyyy HH:mm) từ chuỗi ISO — dùng cho Sự kiện. */
export function formatVNDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN", { timeZone: VN_TIME_ZONE })} · ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: VN_TIME_ZONE })}`;
}

/**
 * `created_at` mặc định của DB (`nowText` trong schema.ts, giữ đúng định dạng
 * `CURRENT_TIMESTAMP` của SQLite trước đây) là giờ UTC dạng
 * "YYYY-MM-DD HH:MM:SS" không kèm múi giờ — `new Date()` sẽ hiểu nhầm thành
 * giờ local máy chủ, nên chuẩn hoá về ISO UTC trước khi dùng. Chuỗi đã là
 * ISO (có "T"/"Z") thì giữ nguyên.
 */
export function dbTimestampToISO(value: string): string {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}Z` : value;
}

/** Định dạng `created_at` của DB theo giờ Việt Nam (dd/mm/yyyy · HH:mm). */
export function formatDbDateTime(value: string | null | undefined): string {
  return value ? formatVNDateTime(dbTimestampToISO(value)) : "";
}

/** Khoá ngày theo giờ Việt Nam dạng "YYYY-MM-DD" — dùng để gom số liệu theo ngày (biểu đồ Dashboard). */
export function vnDateKey(iso: string): string {
  const d = new Date(new Date(iso).getTime() + VN_OFFSET_MINUTES * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Chuyển giá trị <input type="datetime-local"> (người dùng nhập theo giờ
 * Việt Nam, chuỗi không có offset — VD "2026-09-15T09:00") sang ISO UTC thật
 * để lưu DB. Tính thủ công theo offset cố định UTC+7 — không phụ thuộc múi
 * giờ máy chủ đang chạy (khác `new Date(value).toISOString()`, vốn hiểu
 * chuỗi không offset theo giờ LOCAL CỦA MÁY CHỦ, sai nếu server không đặt
 * múi giờ Việt Nam, VD deploy lên cloud mặc định UTC).
 */
export function vnDatetimeLocalToISO(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart || "00:00").split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - VN_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMs).toISOString();
}

/** Chiều ngược lại của `vnDatetimeLocalToISO` — dùng để tự điền giá trị vào <input type="datetime-local"> lúc hiện form Sửa. */
export function isoToVnDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const vnMs = new Date(iso).getTime() + VN_OFFSET_MINUTES * 60 * 1000;
  const d = new Date(vnMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
