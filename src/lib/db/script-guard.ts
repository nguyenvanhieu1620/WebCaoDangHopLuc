/**
 * Chặn các script chỉ dành cho máy dev (seed dữ liệu mẫu, nạp demo, chép SQLite cũ) khi
 * lỡ chạy trên VPS thật: seed tạo tài khoản admin mật khẩu mẫu ai cũng biết + hồ sơ tuyển
 * sinh giả; demo nạp ảnh người mẫu Unsplash làm "giảng viên" (CLAUDE.md mục 9).
 *
 * Nhận diện môi trường thật: `NODE_ENV=production`, HOẶC `NEXT_PUBLIC_SITE_URL` trỏ tới tên
 * miền thật — biến này bắt buộc đặt đúng domain trên VPS (sitemap/Open Graph), nên script
 * chạy tay trong shell (thường không có NODE_ENV) vẫn bị nhận ra.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"]);

export function looksLikeProduction(env: Record<string, string | undefined> = process.env): boolean {
  if (env.NODE_ENV === "production") return true;
  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site) return false;
  try {
    const host = new URL(site).hostname.toLowerCase();
    return !(LOCAL_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".test"));
  } catch {
    // URL viết sai (VD thiếu https://) → coi là môi trường thật, an toàn hơn coi là máy dev.
    return true;
  }
}

/** Ý định chạy seed thật phải giữ nguyên cả khi URL còn trống/localhost. */
export function isProductionSeed(
  env: Record<string, string | undefined> = process.env,
  argv: readonly string[] = process.argv
): boolean {
  return looksLikeProduction(env) || argv.includes("--allow-production") || Boolean(env.SEED_ADMIN_PASSWORD);
}

/**
 * Dừng script (exit 1) nếu đang ở môi trường thật. `allowFlag` (VD "--allow-production"):
 * cho phép chạy khi người vận hành cố ý truyền cờ này; bỏ trống = không có cách nào chạy.
 */
export function refuseInProduction(scriptName: string, allowFlag?: string): void {
  if (!looksLikeProduction()) return;
  if (allowFlag && process.argv.includes(allowFlag)) {
    console.warn(`⚠️  ${scriptName}: đang chạy trên môi trường THẬT theo cờ ${allowFlag}.`);
    return;
  }
  console.error(
    `✋ ${scriptName} chỉ dành cho máy dev — đang phát hiện môi trường thật ` +
      `(NODE_ENV=production hoặc NEXT_PUBLIC_SITE_URL không phải localhost). Đã dừng, không đụng gì tới dữ liệu.` +
      (allowFlag ? `\n   Nếu chắc chắn muốn chạy: thêm cờ ${allowFlag} (VD: npm run ${scriptName} -- ${allowFlag}).` : "")
  );
  process.exit(1);
}
