import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Kết nối CSDL dùng chung toàn app — singleton để tránh mở nhiều connection
 * khi Next.js hot-reload lúc dev.
 *
 * Dùng @libsql/client (không phải better-sqlite3): cùng là SQLite nhưng dùng
 * binary dựng sẵn theo từng hệ điều hành (napi-rs, tải tự động qua npm khi
 * `npm install`) — KHÔNG cần cài Python/node-gyp để biên dịch như
 * better-sqlite3, tránh lỗi cài đặt trên máy không có sẵn Python (đặc biệt
 * hay gặp trên Windows).
 *
 * Khi chuyển sang PostgreSQL (Aurora), thay khối bên dưới bằng:
 *   import { drizzle } from "drizzle-orm/node-postgres";
 *   import { Pool } from "pg";
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *   export const db = drizzle(pool, { schema });
 * — mọi nơi khác trong code gọi `db.select()/.insert()/...` giữ nguyên không đổi.
 */

declare global {
  var __libsqlClient: ReturnType<typeof createClient> | undefined;
}

const DB_URL = process.env.DATABASE_URL || "file:./drizzle/dev.db";

const client = global.__libsqlClient ?? createClient({ url: DB_URL });
if (process.env.NODE_ENV !== "production") {
  global.__libsqlClient = client;
}

export const db = drizzle(client, { schema });
