import "dotenv/config";
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { count, getTableColumns, getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { closeDb, db } from "./client";
import * as schema from "./schema";

/**
 * Chép TOÀN BỘ dữ liệu từ file SQLite cũ (trước khi chuyển sang PostgreSQL ngày
 * 06/10/2026) sang Postgres — giữ nguyên ID, nên link cũ, liên kết giữa các bảng
 * và manifest dữ liệu demo (`npm run demo:clean`) vẫn đúng.
 *
 *   npm run db:migrate                         # tạo bảng trên Postgres trước
 *   npm run db:import-sqlite                   # chép từ SQLITE_URL (mặc định drizzle/dev.db)
 *   npm run db:import-sqlite -- --replace      # xoá sạch dữ liệu Postgres hiện có rồi chép lại
 *
 * - Đọc từng bảng theo `rowid` (thứ tự chèn) → cột `seq` bên Postgres đánh số đúng
 *   thứ tự cũ, các danh sách trùng khoá sắp xếp hiện y như trước.
 * - DB cũ thiếu bảng/cột (máy chưa chạy đủ migration SQLite) → bảng bỏ qua, cột
 *   nhận giá trị mặc định. Cột thừa (không còn trong schema) được liệt kê, không chép.
 * - Ghi trong 1 transaction: lỗi giữa chừng thì Postgres không bị chép dở dang.
 * - Không tự xoá dữ liệu: Postgres đã có dữ liệu thì dừng, trừ khi thêm `--replace`.
 */

const SQLITE_URL = process.env.SQLITE_URL || "file:./drizzle/dev.db";
const REPLACE = process.argv.includes("--replace");
const CHUNK = 200;

type Row = Record<string, unknown>;

const tables: PgTable[] = (Object.values(schema) as unknown[]).filter((v): v is PgTable => is(v, PgTable));

function coerce(value: unknown, dataType: string): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") value = Number(value);
  if (dataType === "number") return typeof value === "number" ? value : Number(value);
  if (dataType === "string") return typeof value === "string" ? value : String(value);
  return value;
}

async function main() {
  const filePath = SQLITE_URL.replace(/^file:/, "");
  if (!fs.existsSync(filePath)) throw new Error(`Không thấy file SQLite: ${filePath} (đặt SQLITE_URL trong .env).`);
  const sqlite = createClient({ url: SQLITE_URL });

  try {
    const existing: string[] = [];
    for (const table of tables) {
      const [{ value }] = await db.select({ value: count() }).from(table);
      if (value > 0) existing.push(`${getTableName(table)} (${value})`);
    }
    if (existing.length && !REPLACE) {
      throw new Error(
        `Postgres đã có dữ liệu: ${existing.join(", ")}.\n` +
          "Chạy lại với `npm run db:import-sqlite -- --replace` để XOÁ SẠCH dữ liệu Postgres rồi chép lại từ SQLite.",
      );
    }

    const sqliteTables = new Set(
      (await sqlite.execute("select name from sqlite_master where type = 'table'")).rows.map((r) => String(r.name)),
    );

    const report: { table: string; source: number; copied: number; note: string }[] = [];

    await db.transaction(async (tx) => {
      if (REPLACE) {
        const names = tables.map((t) => `"${getTableName(t)}"`).join(", ");
        await tx.execute(sql.raw(`TRUNCATE ${names} RESTART IDENTITY`));
      }

      for (const table of tables) {
        const name = getTableName(table);
        if (!sqliteTables.has(name)) {
          report.push({ table: name, source: 0, copied: 0, note: "không có trong SQLite — bỏ qua" });
          continue;
        }
        const columns = Object.entries(getTableColumns(table)).filter(([key]) => key !== "seq");
        const rows = (await sqlite.execute(`select * from "${name}" order by rowid`)).rows as unknown as Row[];
        const sourceCols = new Set(rows.length ? Object.keys(rows[0]) : []);
        const missing = columns.filter(([, col]) => rows.length && !sourceCols.has(col.name)).map(([, col]) => col.name);
        const known = new Set(columns.map(([, col]) => col.name));
        const extra = [...sourceCols].filter((c) => !known.has(c));

        const values = rows.map((row) => {
          const out: Row = {};
          for (const [key, col] of columns) {
            if (sourceCols.has(col.name)) out[key] = coerce(row[col.name], col.dataType);
          }
          return out;
        });
        for (let i = 0; i < values.length; i += CHUNK) {
          await tx.insert(table).values(values.slice(i, i + CHUNK));
        }

        const [{ value }] = await tx.select({ value: count() }).from(table);
        const notes = [
          missing.length ? `cột mới dùng mặc định: ${missing.join(", ")}` : "",
          extra.length ? `cột cũ không chép: ${extra.join(", ")}` : "",
        ].filter(Boolean);
        report.push({ table: name, source: rows.length, copied: value, note: notes.join("; ") });
      }

      const mismatch = report.filter((r) => r.source !== r.copied);
      if (mismatch.length) {
        throw new Error(`Số dòng không khớp: ${mismatch.map((r) => `${r.table} ${r.source}→${r.copied}`).join(", ")}`);
      }
    });

    console.table(report);
    const total = report.reduce((sum, r) => sum + r.copied, 0);
    console.log(`✓ Đã chép ${total} dòng / ${report.length} bảng từ ${SQLITE_URL} sang Postgres — số dòng từng bảng khớp 100%.`);
  } finally {
    sqlite.close();
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closeDb);
