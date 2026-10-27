/**
 * Giới hạn tần suất gọi API công khai (đăng ký tuyển sinh, liên hệ, tra cứu)
 * — chặn bot spam cơ bản. Lưu bộ đếm trong bộ nhớ (Map), KHÔNG cần Redis hay
 * dịch vụ ngoài — đủ dùng khi chạy 1 tiến trình Node dài hạn (VPS/container).
 *
 * Lưu ý khi lên production nhiều instance (VD serverless nhiều region): bộ
 * đếm không chia sẻ giữa các instance, giới hạn thực tế sẽ lỏng hơn số khai
 * báo — nếu cần chính xác tuyệt đối lúc đó mới cần chuyển sang lưu ở
 * Redis/DB dùng chung.
 */

import { isIP } from "node:net";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Check without consuming an attempt; authentication records failures only. */
export function isRateLimited(key: string, limit: number): boolean {
  pruneExpired(Date.now());
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit;
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
let warnedUnknownIp = false;

function unknownIp(): string {
  if (process.env.NODE_ENV === "production" && !warnedUnknownIp) {
    warnedUnknownIp = true;
    console.warn("Chưa xác định IP qua proxy tin cậy: các request dùng chung rate limit. Kiểm tra TRUST_PROXY_HOPS và cấu hình proxy trước khi public.");
  }
  return "unknown";
}

/** Dọn khoá hết hạn kể cả khi chỉ có ít khoá, tránh giữ email/IP cũ vô thời hạn. */
function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Trả về true nếu request được phép, false nếu đã vượt giới hạn trong khung thời gian. */
export function checkRateLimit(key: string, limit: number, windowMs: number, cost = 1): boolean {
  if (!Number.isInteger(cost) || cost < 1 || cost > limit) return false;
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: cost, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count + cost > limit) return false;
  bucket.count += cost;
  return true;
}

/**
 * Chỉ tin số hop proxy đã cấu hình, đếm từ PHẢI của X-Forwarded-For.
 * Proxy phải append IP nguồn thật hoặc ghi đè header; origin phải chặn truy
 * cập trực tiếp. Mặc định không tin header và dùng bucket chung "unknown".
 */
export function getClientIp(request: { headers: Headers }): string {
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? "0");
  if (!Number.isInteger(hops) || hops < 1 || hops > 16) return unknownIp();
  const chain = request.headers.get("x-forwarded-for")?.split(",").map((ip) => ip.trim()) ?? [];
  const ip = chain[chain.length - hops];
  return ip && isIP(ip) ? ip : unknownIp();
}
