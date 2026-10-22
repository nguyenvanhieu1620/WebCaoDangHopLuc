import { access, constants } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/upload-dir";

/**
 * Kiểm tra sức khoẻ web — cho dịch vụ theo dõi uptime (UptimeRobot…) và script triển khai gọi sau
 * khi khởi động lại. 200 = mọi thứ ổn; 503 = có phần hỏng. Chỉ trả "ok"/"error" từng phần, không
 * lộ chi tiết lỗi (thông báo lỗi Postgres có thể chứa tên máy/user) ra ngoài.
 *  - database: chạy được `SELECT 1` trong 3 giây.
 *  - uploads: thư mục public/uploads ghi được (admin tải ảnh lên được).
 */
export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 3000;

async function passes(task: () => Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([task(), timeout]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [database, uploads] = await Promise.all([
    passes(() => db.execute(sql`select 1`)),
    passes(() => access(/* turbopackIgnore: true */ UPLOAD_DIR, constants.W_OK)),
  ]);
  const ok = database && uploads;
  return Response.json(
    {
      status: ok ? "ok" : "error",
      checks: { database: database ? "ok" : "error", uploads: uploads ? "ok" : "error" },
      uptimeSeconds: Math.round(process.uptime()),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
