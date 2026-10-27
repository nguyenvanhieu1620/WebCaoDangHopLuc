import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_DIR } from "@/lib/upload-dir";
import { parseRange } from "@/lib/http-range";

/**
 * Phục vụ file trong `public/uploads/` đọc thẳng từ ổ đĩa ở MỖI request.
 *
 * Vì sao cần: bản production (`next start`) chỉ phục vụ các file có sẵn trong `public/` LÚC KHỞI ĐỘNG —
 * ảnh/video admin tải lên sau đó trả 404 (cả `/_next/image`) cho tới khi khởi động lại web (đã đo thật
 * 19/10/2026). File có từ lúc khởi động vẫn do Next phục vụ như cũ (đi trước route này); file mới rơi
 * xuống đây. Hỗ trợ `Range` để video tua/phát được trên mọi trình duyệt (Safari bắt buộc).
 */

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const notFound = () => new Response("Not found", { status: 404 });

/** Đường dẫn file thật trong UPLOAD_DIR, hoặc null nếu tên không hợp lệ / cố lách ra ngoài thư mục. */
function resolveUpload(parts: string[]): string | null {
  if (parts.length === 0 || parts.some((p) => !p || p === "." || p === ".." || p.startsWith(".") || /[\\/\0]/.test(p))) return null;
  const full = path.resolve(UPLOAD_DIR, ...parts);
  return full.startsWith(UPLOAD_DIR + path.sep) ? full : null;
}

async function serve(request: Request, params: Promise<{ path: string[] }>, headOnly: boolean) {
  const full = resolveUpload((await params).path);
  const type = full ? MIME[path.extname(full).toLowerCase()] : undefined;
  if (!full || !type) return notFound();
  // turbopackIgnore: đường dẫn chỉ biết lúc chạy (file admin tải lên) — không cần Turbopack lần theo khi đóng gói.
  const info = await stat(/* turbopackIgnore: true */ full).catch(() => null);
  if (!info?.isFile()) return notFound();

  const headers = new Headers({
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Last-Modified": info.mtime.toUTCString(),
    // Media có thể bị admin xoá; không yêu cầu trình duyệt giữ bản sao một năm.
    "Cache-Control": "public, max-age=60, must-revalidate",
  });
  const body = (start: number, end: number) =>
    headOnly ? null : (Readable.toWeb(createReadStream(/* turbopackIgnore: true */ full, { start, end })) as unknown as ReadableStream);

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, info.size);
    if (!range) {
      headers.set("Content-Range", `bytes */${info.size}`);
      return new Response(null, { status: 416, headers });
    }
    const [start, end] = range;
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(body(start, end), { status: 206, headers });
  }
  headers.set("Content-Length", String(info.size));
  return new Response(info.size === 0 ? null : body(0, info.size - 1), { status: 200, headers });
}

export function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return serve(request, ctx.params, false);
}

export function HEAD(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return serve(request, ctx.params, true);
}
