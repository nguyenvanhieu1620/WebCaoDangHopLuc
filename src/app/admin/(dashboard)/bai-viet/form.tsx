import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { CheckedFileInput } from "@/components/admin/CheckedFileInput";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertPostAction } from "./actions";

const input = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/**
 * Trang Viết bài mới (không có `id`) / Sửa bài viết — dùng chung cho `them-moi/` và `[id]/`.
 * Bố cục 2 cột trên máy tính: trái = tiêu đề, mô tả, nội dung; phải = danh mục, ảnh, tệp, ghim, đăng.
 */
export async function PostFormPage({ id }: { id?: string }) {
  await requirePermission("posts");
  const [editing, categories, mediaImages] = await Promise.all([
    id ? db.query.posts.findFirst({ where: eq(schema.posts.id, id) }) : null,
    db.query.categories.findMany({ orderBy: [asc(schema.categories.name), asc(schema.categories.seq)] }),
    listMediaImages(),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? "Sửa bài viết" : "Viết bài mới"}
      description="Tin tức & thông báo trên website"
      backHref="/admin/bai-viet"
      wide
    >
      {editing && (
        <p className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-faint">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${editing.status === "published" ? "bg-brand-100 text-brand-700" : "bg-paper-alt text-ink-faint"}`}>
            {editing.status === "published" ? "Đã đăng" : "Bản nháp"}
          </span>
          {editing.status === "published" ? (
            <a href={`/tin-tuc/${editing.slug}`} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-brand-700 hover:underline">
              /tin-tuc/{editing.slug} ↗
            </a>
          ) : (
            <span className="font-mono">/tin-tuc/{editing.slug}</span>
          )}
          <span>— đổi tiêu đề không đổi link này</span>
        </p>
      )}
      <form action={upsertPostAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <div>
              <label htmlFor="f-bai-viet-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề</label>
              <input id="f-bai-viet-title" name="title" required defaultValue={editing?.title} className={input} placeholder="VD: Thông báo lịch thi cuối kỳ" />
            </div>
            <div>
              <label htmlFor="f-bai-viet-excerpt" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mô tả ngắn</label>
              <input id="f-bai-viet-excerpt" name="excerpt" defaultValue={editing?.excerpt ?? ""} className={input} placeholder="Tóm tắt 1 câu (tuỳ chọn)" />
            </div>
            <div>
              <label htmlFor="f-bai-viet-content" className="mb-1.5 block text-xs font-semibold text-ink-soft">Nội dung</label>
              <MarkdownEditor
                id="f-bai-viet-content"
                name="content"
                required
                rows={18}
                defaultValue={editing?.content}
                placeholder="Nội dung đầy đủ của bài viết..."
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "title", enName: "titleEn" },
                    { viName: "excerpt", enName: "excerptEn" },
                    { viName: "content", enName: "contentEn" },
                  ]}
                />
                <input aria-label="Title (English)" name="titleEn" defaultValue={editing?.titleEn ?? ""} placeholder="Title (English)" className={input} />
                <input aria-label="Short excerpt (English)" name="excerptEn" defaultValue={editing?.excerptEn ?? ""} placeholder="Short excerpt (English)" className={input} />
                <MarkdownEditor aria-label="Full content in English..." name="contentEn" rows={10} defaultValue={editing?.contentEn ?? ""} placeholder="Full content in English..." />
              </div>
            </details>
          </div>

          <div className="min-w-0 space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="f-bai-viet-categoryId" className="block text-xs font-semibold text-ink-soft">Danh mục</label>
                <Link href="/admin/danh-muc" className="text-[11px] font-semibold text-brand-700 hover:underline">
                  Quản lý danh mục
                </Link>
              </div>
              <select id="f-bai-viet-categoryId" name="categoryId" className={input} defaultValue={editing?.categoryId ?? ""}>
                <option value="">— Không chọn —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-bai-viet-coverImage" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh đại diện (tuỳ chọn){editing ? " — để trống = giữ ảnh cũ" : ""}
              </label>
              <ImagePicker
                id="f-bai-viet-coverImage"
                spec="cover"
                fileFieldName="coverImage"
                pickedFieldName="coverImageExisting"
                images={mediaImages}
                currentUrl={editing?.coverImageUrl}
              />
            </div>
            <div>
              <label htmlFor="f-bai-viet-attachment" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Tệp đính kèm (tuỳ chọn) — PDF/Word/Excel
              </label>
              {editing?.attachmentUrl && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-line bg-paper-alt px-3 py-2 text-[12.5px]">
                  <a href={editing.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate font-semibold text-brand-700 hover:underline">
                    📎 {editing.attachmentName || "Tệp đính kèm hiện tại"}
                  </a>
                  <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-accent-600">
                    <input type="checkbox" name="removeAttachment" className="h-3.5 w-3.5 rounded border-line" />
                    Xoá
                  </label>
                </div>
              )}
              <CheckedFileInput
                id="f-bai-viet-attachment"
                kinds={["document"]}
                name="attachment"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="w-full max-w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-brand-700"
              />
              <p className="mt-1 text-[11px] text-ink-faint">VD: quyết định tuyển sinh, biểu mẫu — hiện link tải ngay dưới bài viết. Tối đa 20MB.</p>
            </div>
            <div className="space-y-3 rounded-lg border border-line p-3">
              <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                <input type="checkbox" name="isPinned" defaultChecked={!!editing?.isPinned} className="h-4 w-4 rounded border-line" />
                Ghim làm Thông báo nổi bật ở Trang chủ
              </label>
              {editing ? (
                <p className="text-[11px] text-ink-faint">
                  Trạng thái đăng/nháp đổi bằng nút &quot;Đăng ngay&quot;/&quot;Gỡ đăng&quot; ở danh sách bài viết.
                </p>
              ) : (
                <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <input type="checkbox" name="publishNow" className="h-4 w-4 rounded border-line" />
                  Đăng ngay (bỏ chọn = lưu bản nháp)
                </label>
              )}
            </div>
          </div>
        </div>
        <FormActions cancelHref="/admin/bai-viet" submitLabel={editing ? "Lưu thay đổi" : "Lưu bài viết"} />
      </form>
    </AdminFormLayout>
  );
}
