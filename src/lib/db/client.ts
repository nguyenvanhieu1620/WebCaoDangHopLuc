import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Kết nối CSDL dùng chung toàn app — PostgreSQL qua driver `pg` (node-postgres),
 * 1 pool kết nối / tiến trình. Chuyển từ SQLite (@libsql/client) ngày 06/10/2026
 * (xem CLAUDE.md mục 4.4): dev chạy Postgres trong Docker (`docker compose up -d`,
 * xem docker-compose.yml), production là Postgres trên VPS — chỉ khác `DATABASE_URL`.
 *
 * Mọi nơi khác gọi `db.select()/.insert()/db.query...` như cũ — kiểu dữ liệu cột
 * giữ nguyên 1-1 với bản SQLite (xem ghi chú đầu schema.ts).
 */

export type Database = NodePgDatabase<typeof schema>;

declare global {
  var __pgPool: Pool | undefined;
  /**
   * CHỈ dùng trong test (tests/*.test.ts): gắn sẵn 1 DB Postgres trong bộ nhớ
   * (PGlite) TRƯỚC khi import code app, để `npm test` không cần Docker/server DB.
   */
  var __testDb: Database | undefined;
}

/** Khớp docker-compose.yml — chỉ dùng khi dev quên tạo .env, production bắt buộc có DATABASE_URL. */
const DEV_DATABASE_URL = "postgres://hopluc:hopluc_dev@localhost:5432/hopluc";

function createPool(): Pool {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || (process.env.NODE_ENV === "production" ? undefined : DEV_DATABASE_URL),
    // 10 kết nối là thừa cho 1 trường (mỗi trang chạy song song ~5-10 truy vấn ngắn).
    max: Number(process.env.DATABASE_POOL_MAX) || 10,
    // Script (migrate/seed/demo) tự thoát khi xong việc thay vì treo chờ kết nối rảnh.
    allowExitOnIdle: true,
  });
  // Kết nối đang rảnh bị đứt (Postgres khởi động lại, mất mạng) phát sự kiện "error"
  // trên pool — không bắt thì Node coi là lỗi chưa xử lý và SẬP cả tiến trình web.
  // Pool tự bỏ kết nối hỏng, truy vấn sau mở kết nối mới.
  pool.on("error", (err) => console.error("[db] Kết nối Postgres rảnh bị lỗi:", err.message));
  return pool;
}

function createDb(): Database {
  if (globalThis.__testDb) return globalThis.__testDb;
  // Giữ pool qua các lần hot-reload lúc dev — không thì mỗi lần sửa code lại mở pool mới.
  const pool = globalThis.__pgPool ?? createPool();
  globalThis.__pgPool = pool;
  return drizzle(pool, { schema });
}

export const db = createDb();

/** Đóng pool — gọi ở cuối các script CLI (migrate, seed, demo, import). */
export async function closeDb() {
  const pool = globalThis.__pgPool;
  globalThis.__pgPool = undefined;
  await pool?.end();
}
