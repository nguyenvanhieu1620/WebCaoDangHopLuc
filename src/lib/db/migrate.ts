import "dotenv/config";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client";

/**
 * Áp dụng migration đã sinh bằng `npm run db:generate` (thư mục ./drizzle).
 * An toàn chạy lại nhiều lần — Drizzle tự lưu migration đã áp dụng vào bảng
 * `__drizzle_migrations`, bỏ qua migration đã chạy rồi. Dùng thay cho
 * `drizzle-kit push` (có bug thật với driver libsql — xem CLAUDE.md mục 4.2).
 */
async function main() {
  console.log("Đang áp dụng migration...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migration hoàn tất.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
