import Link from "next/link";
import type { ReactNode } from "react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";

/**
 * Khung trang Thêm mới / Sửa riêng của mọi mục quản trị (đổi 19/10/2026: form không còn nằm chung trang
 * với danh sách). Thanh tiêu đề có nút "← Danh sách"; form nằm trong 1 thẻ trắng giữa trang.
 * `wide` cho form có trình soạn nội dung dài (Bài viết, Trang tĩnh, Ngành…).
 */
export function AdminFormLayout({
  title,
  description,
  backHref,
  backLabel = "Danh sách",
  wide,
  children,
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <AdminTopbar
        title={title}
        description={description}
        actions={
          <Link
            href={backHref}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-500 hover:text-brand-700"
          >
            ← <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        }
      />
      <div className="p-5 sm:p-8">
        <div className={cn("mx-auto rounded-2xl border border-line bg-white p-5 shadow-sm2 sm:p-8", wide ? "max-w-5xl" : "max-w-3xl")}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Nút "+ Thêm mới" đặt ở thanh tiêu đề trang danh sách — mở trang thêm mới riêng. */
export function AdminNewButton({ href, label = "Thêm mới" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm2 transition-colors hover:bg-brand-800"
    >
      <span aria-hidden="true" className="text-base leading-none">+</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </Link>
  );
}

/** Dải xác nhận "Đã lưu" trên trang danh sách sau khi Lưu ở trang Thêm/Sửa (`?saved=1`). */
export function SavedNotice({ show, text = "Đã lưu thay đổi thành công." }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div role="status" className="mb-5 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
      ✓ {text}
    </div>
  );
}

/** Hàng nút cuối form: Lưu + Huỷ (về danh sách). */
export function FormActions({ cancelHref, submitLabel = "Lưu" }: { cancelHref: string; submitLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <button type="submit" className="rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800">
        {submitLabel}
      </button>
      <Link href={cancelHref} className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-500 hover:text-brand-700">
        Huỷ
      </Link>
    </div>
  );
}
