import type { Metadata } from "next";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { CheckedFileInput } from "@/components/admin/CheckedFileInput";
import { requirePermission } from "@/lib/admin-auth";
import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/upload-rules";
import { uploadMediaAction } from "../actions";

export const metadata: Metadata = { title: "Tải tệp lên" };

/** Trang tải tệp lên Thư viện media (chọn nhiều tệp 1 lần) — tải xong về danh sách kèm số tệp đã thêm. */
export default async function UploadMediaPage() {
  await requirePermission("media");
  return (
    <AdminFormLayout title="Tải tệp lên" description="Ảnh/video dùng chung cho toàn site" backHref="/admin/media">
      <form action={uploadMediaAction} className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 px-6 py-10 text-center">
          <label htmlFor="f-media-files" className="font-display text-[17px] font-semibold text-ink">
            Chọn tệp để tải lên
          </label>
          <p className="text-[13px] text-ink-faint">
            Hỗ trợ JPG, PNG, WEBP, GIF, MP4, WEBM · Tối đa {formatBytes(MAX_UPLOAD_BYTES.image)} ảnh / {formatBytes(MAX_UPLOAD_BYTES.video)} video · Chọn
            được nhiều tệp cùng lúc
            <br />
            Ảnh dùng cho banner nên rộng ≥ 1920px — kích thước khuyến nghị riêng từng chỗ hiện ngay dưới ô chọn ảnh ở mỗi form.
          </p>
          <CheckedFileInput
            id="f-media-files"
            kinds={["image", "video"]}
            name="files"
            multiple
            required
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            className="mt-2 max-w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-brand-700 file:shadow-sm2"
          />
        </div>
        <FormActions cancelHref="/admin/media" submitLabel="Tải lên" />
      </form>
    </AdminFormLayout>
  );
}
