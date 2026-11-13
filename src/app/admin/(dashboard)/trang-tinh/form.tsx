import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { hasPlaceholder, staticPageHref } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { upsertPageAction } from "./actions";
import { PageIdentityFields } from "./page-identity-fields";

/** Trang Thêm (không có `id`) / Sửa trang tĩnh — dùng chung cho `them-moi/` và `[id]/`. */
export async function StaticPageFormPage({ id }: { id?: string }) {
  await requirePermission("pages");
  const [editing, mediaImages] = await Promise.all([
    id ? db.query.pages.findFirst({ where: eq(schema.pages.id, id) }) : null,
    listMediaImages(),
  ]);
  if (id && !editing) notFound();
  const publicHref = editing ? staticPageHref(editing.slug) : null;

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.title}` : "Thêm trang tĩnh"}
      description="Quản lý nội dung các trang Công khai, Giới thiệu, Liên hệ và Chính sách bảo mật"
      backHref="/admin/trang-tinh"
      wide
    >
      {publicHref && (
        <p className="mb-5 text-[12.5px] text-ink-faint">
          Trang trên web:{" "}
          <a href={publicHref} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-brand-700 hover:underline">
            {publicHref} ↗
          </a>
        </p>
      )}
      <AdminSaveForm
        key={id ?? "new"}
        action={upsertPageAction}
        unknownResultMessage="Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và danh sách trang trước khi thử lại."
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <PageIdentityFields initialTitle={editing?.title} existingSlug={editing?.slug} />
        <div>
          <label htmlFor="f-trang-tinh-coverImage" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh banner (tuỳ chọn){editing ? " — để trống = giữ ảnh cũ" : ""}
          </label>
          <ImagePicker
            id="f-trang-tinh-coverImage"
            spec="pageBanner"
            fileFieldName="coverImage"
            pickedFieldName="coverImageExisting"
            images={mediaImages}
            currentUrl={editing?.coverImageUrl}
          />
        </div>
        <div>
          <label htmlFor="f-trang-tinh-content" className="mb-1.5 block text-xs font-semibold text-ink-soft">Nội dung</label>
          {editing && hasPlaceholder(editing.content) && (
            <p className="mb-1.5 rounded-lg bg-accent-100 px-3 py-2 text-[11.5px] font-semibold text-accent-700">
              ⚠️ Nội dung còn chỗ dạng <code>[...]</code> chưa điền — khách xem trang này trên web sẽ thấy nguyên văn. Điền số
              liệu/nội dung thật rồi thay thế trước khi công khai.
            </p>
          )}
          <MarkdownEditor
            id="f-trang-tinh-content"
            name="content"
            required
            rows={18}
            defaultValue={editing?.content}
            placeholder="Nội dung đầy đủ của trang..."
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "title", enName: "titleEn" },
                { viName: "content", enName: "contentEn" },
              ]}
            />
            <input
              aria-label="Title (English)"
              name="titleEn"
              defaultValue={editing?.titleEn ?? ""}
              placeholder="Title (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <MarkdownEditor aria-label="Full content (English)" name="contentEn" rows={12} defaultValue={editing?.contentEn ?? ""} placeholder="Full content (English)" />
          </div>
        </details>
        <FormActions cancelHref="/admin/trang-tinh" submitLabel={editing ? "Lưu thay đổi" : "Thêm trang"} />
      </AdminSaveForm>
    </AdminFormLayout>
  );
}
