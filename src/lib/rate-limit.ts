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

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Dọn bớt bucket đã hết hạn khi Map phình to, tránh rò rỉ bộ nhớ dài hạn. */
function pruneExpired(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** Trả về true nếu request được phép, false nếu đã vượt giới hạn trong khung thời gian. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Lấy địa chỉ IP client từ header proxy chuẩn (Vercel/Nginx đều set x-forwarded-for). */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}
