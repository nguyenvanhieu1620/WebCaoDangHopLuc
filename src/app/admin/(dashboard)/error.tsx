"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/upload-rules";

/**
 * Error boundary của khu quản trị — hiện NGAY TRONG khung admin (sidebar vẫn còn) thay vì
 * trang lỗi chung của web. Hay gặp nhất khi bấm Lưu một form có tải file mà file không hợp
 * lệ lọt qua bước kiểm tra trên trình duyệt (form đã chặn sẵn, xem ImagePicker/
 * CheckedFileInput) hoặc mất kết nối DB. Bản production Next.js ẩn nội dung lỗi gốc, nên
 * liệt kê các nguyên nhân thường gặp; bản dev vẫn hiện `error.message`.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-8">
      <div className="max-w-2xl rounded-2xl border border-accent-200 bg-white p-6 shadow-sm2">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-600">Không thực hiện được</div>
        <h1 className="mt-2 font-display text-[22px] font-semibold text-brand-900">Thao tác vừa rồi chưa được lưu</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">Nguyên nhân thường gặp:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink-soft">
          <li>
            File tải lên quá lớn — ảnh tối đa {formatBytes(MAX_UPLOAD_BYTES.image)}, tài liệu {formatBytes(MAX_UPLOAD_BYTES.document)}, video{" "}
            {formatBytes(MAX_UPLOAD_BYTES.video)}.
          </li>
          <li>Sai định dạng — ảnh chỉ nhận JPG/PNG/WEBP/GIF (ảnh HEIC của iPhone cần chuyển sang JPG trước).</li>
          <li>Mất kết nối tới máy chủ hoặc cơ sở dữ liệu — thử lại sau ít phút.</li>
        </ul>
        {process.env.NODE_ENV !== "production" && error.message && (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-paper-alt p-3 font-mono text-[12px] text-ink-soft">{error.message}</pre>
        )}
        {error.digest && <p className="mt-3 font-mono text-[11px] text-ink-faint">Mã lỗi: {error.digest}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-red"
          >
            Thử lại
          </button>
          <Link href="/admin" className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700">
            Về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
