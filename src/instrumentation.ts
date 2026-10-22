/**
 * Next.js gọi `register()` 1 lần khi máy chủ khởi động. Ở chế độ production: in cảnh báo cấu hình
 * `.env` còn thiếu/sai (TRUST_PROXY_HOPS, tên miền…) ra log ngay đầu — xem src/lib/prod-config.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { productionConfigProblems } = await import("@/lib/prod-config");
  const problems = productionConfigProblems(process.env);
  if (problems.length === 0) return;
  console.warn(`\n⚠️  [cấu hình] ${problems.length} vấn đề cần sửa trong .env trước khi public:`);
  for (const p of problems) console.warn(`   • ${p}`);
  console.warn("");
}
