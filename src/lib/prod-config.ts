/**
 * Kiểm tra cấu hình `.env` lúc web khởi động ở chế độ production (gọi từ src/instrumentation.ts).
 * Trả về danh sách vấn đề bằng tiếng Việt — chỉ CẢNH BÁO trong log, không chặn khởi động (riêng
 * SESSION_SECRET mẫu đã bị chặn cứng ở src/lib/auth.ts). Hàm thuần, có test.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"]);

export function productionConfigProblems(env: Record<string, string | undefined>): string[] {
  const problems: string[] = [];

  const hops = Number(env.TRUST_PROXY_HOPS ?? "0");
  if (!Number.isInteger(hops) || hops < 0 || hops > 16) {
    problems.push(`TRUST_PROXY_HOPS="${env.TRUST_PROXY_HOPS}" không hợp lệ (phải là số nguyên 0–16).`);
  } else if (hops === 0) {
    problems.push(
      "TRUST_PROXY_HOPS=0: không đọc được IP thật của khách nên MỌI người dùng chung 1 bộ đếm giới hạn — " +
        "cả web chỉ nhận 5 hồ sơ tuyển sinh / 5 tin liên hệ mỗi 10 phút. Chạy sau Nginx: đặt TRUST_PROXY_HOPS=1 " +
        "(Nginx: proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for) và chặn truy cập thẳng vào cổng Node."
    );
  }

  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  let host = "";
  try {
    host = site ? new URL(site).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  if (!host || LOCAL_HOSTS.has(host)) {
    problems.push(
      "NEXT_PUBLIC_SITE_URL chưa phải tên miền thật — sitemap, robots và ảnh/link chia sẻ Facebook/Zalo sẽ trỏ về localhost. " +
        "Đặt VD NEXT_PUBLIC_SITE_URL=\"https://hopluc.edu.vn\" rồi build lại (biến NEXT_PUBLIC_* gắn vào lúc build)."
    );
  } else if (site && !site.startsWith("https://")) {
    problems.push("NEXT_PUBLIC_SITE_URL nên dùng https:// khi lên mạng thật.");
  }

  const secret = env.SESSION_SECRET ?? "";
  if (secret.length < 32) {
    problems.push("SESSION_SECRET quá ngắn (< 32 ký tự) — sinh chuỗi ngẫu nhiên dài: node -e \"console.log(require('node:crypto').randomBytes(48).toString('hex'))\".");
  }

  if (!env.DATABASE_URL) {
    problems.push("Thiếu DATABASE_URL — web không kết nối được CSDL.");
  }

  return problems;
}
