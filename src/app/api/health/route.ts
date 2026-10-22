import { access, constants, statfs } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/upload-dir";

/**
 * Kiểm tra sức khoẻ web — cho dịch vụ theo dõi uptime (UptimeRobot…) và script triển khai gọi sau
 * khi khởi động lại. 200 = mọi thứ ổn; 503 = có phần hỏng. Chỉ trả "ok"/"error" từng phần, không
 * lộ chi tiết lỗi (thông báo lỗi Postgres có thể chứa tên máy/user) hay số liệu máy chủ ra ngoài.
 *  - database: chạy được `SELECT 1` trong 3 giây.
 *  - uploads: thư mục public/uploads ghi được (admin tải ảnh lên được).
 *  - disk: ổ chứa thư mục upload còn trống ≥ HEALTH_MIN_FREE_MB (mặc định 1024MB). Ổ đầy thì tải ảnh,
 *    ghi log, Postgres đều hỏng — báo 503 sớm để dịch vụ theo dõi gửi cảnh báo trước khi web sập.
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

async function enoughDiskSpace() {
  const minFree = (Number(process.env.HEALTH_MIN_FREE_MB) || 1024) * 1024 * 1024;
  const stats = await statfs(/* turbopackIgnore: true */ UPLOAD_DIR);
  if (stats.bavail * stats.bsize < minFree) throw new Error("low disk");
}

export async function GET() {
  const [database, uploads, disk] = await Promise.all([
    passes(() => db.execute(sql`select 1`)),
    passes(() => access(/* turbopackIgnore: true */ UPLOAD_DIR, constants.W_OK)),
    passes(enoughDiskSpace),
  ]);
  const ok = database && uploads && disk;
  const state = (pass: boolean) => (pass ? "ok" : "error");
  return Response.json(
    {
      status: state(ok),
      checks: { database: state(database), uploads: state(uploads), disk: state(disk) },
      uptimeSeconds: Math.round(process.uptime()),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
