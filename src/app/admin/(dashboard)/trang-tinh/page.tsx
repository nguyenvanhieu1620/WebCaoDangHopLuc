import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { upsertPageAction, deletePageAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { hasPlaceholder } from "@/lib/utils";

export const metadata: Metadata = { title: "Quản lý trang tĩnh" };

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("pages");
  const { edit } = await searchParams;
  const allPages = await db.query.pages.findMany({
    orderBy: asc(schema.pages.title),
  });
  const editing = edit
    ? await db.query.pages.findFirst({ where: eq(schema.pages.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: desc(schema.mediaItems.createdAt),
  });

  return (
    <div>
      <AdminTopbar
        title="Trang tĩnh"
        description="Sửa nội dung các trang: Công khai, Giới thiệu, Liên hệ... — sửa xong hiện ngay trên web công khai theo đúng slug"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Danh sách trang */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allPages.length})
            </span>
          </div>
          {allPages.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có trang tĩnh nào. Tạo trang đầu tiên ở form bên phải (VD:
              slug &quot;gioi-thieu&quot; cho trang Giới thiệu).
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allPages.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-ink">{p.title}</span>
                      {hasPlaceholder(p.content) && (
                        <span
                          title="Nội dung còn chỗ [...] chưa điền — khách xem sẽ thấy nguyên văn"
                          className="shrink-0 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700"
                        >
                          ⚠️ Chưa điền
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-faint">/{p.slug}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/trang-tinh?edit=${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deletePageAction(p.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá trang "${p.title}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Form thêm/sửa */}
        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.title}` : "Thêm trang mới"}
            </span>
            {editing && (
              <a href="/admin/trang-tinh" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertPageAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề</label>
              <input
                name="title"
                required
                defaultValue={editing?.title}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Giới thiệu"
              />
            </div>
            {!editing && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Slug (để trống = tự tạo từ tiêu đề)
                </label>
                <input
                  name="slug"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: gioi-thieu"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh banner (tuỳ chọn){editing ? " — để trống = giữ ảnh cũ" : ""}
              </label>
              <ImagePicker
                fileFieldName="coverImage"
                pickedFieldName="coverImageExisting"
                images={mediaImages}
                currentUrl={editing?.coverImageUrl}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Nội dung</label>
              {editing && hasPlaceholder(editing.content) && (
                <p className="mb-1.5 rounded-lg bg-accent-100 px-3 py-2 text-[11.5px] font-semibold text-accent-700">
                  ⚠️ Nội dung còn chỗ dạng <code>[...]</code> chưa điền — khách xem trang này trên
                  web sẽ thấy nguyên văn. Điền số liệu/nội dung thật rồi thay thế trước khi công khai.
                </p>
              )}
              <MarkdownEditor
                name="content"
                required
                rows={8}
                defaultValue={editing?.content}
                placeholder="Nội dung đầy đủ của trang..."
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "title", enName: "titleEn" },
                    { viName: "content", enName: "contentEn" },
                  ]}
                />
                <input
                  name="titleEn"
                  defaultValue={editing?.titleEn ?? ""}
                  placeholder="Title (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <MarkdownEditor
                  name="contentEn"
                  rows={8}
                  defaultValue={editing?.contentEn ?? ""}
                  placeholder="Full content (English)"
                />
              </div>
            </details>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm trang"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
