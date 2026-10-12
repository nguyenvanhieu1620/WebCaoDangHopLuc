import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { CheckedFileInput } from "@/components/admin/CheckedFileInput";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { upsertPostAction, togglePublishAction, deletePostAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Quản lý bài viết" };

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "published", label: "Đã đăng" },
  { key: "draft", label: "Bản nháp" },
] as const;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; edit?: string }>;
}) {
  await requirePermission("posts");
  const { q, status, edit } = await searchParams;
  const activeStatus = status === "published" || status === "draft" ? status : "all";

  const [allPosts, categories, mediaImages] = await Promise.all([
    db.query.posts.findMany({ orderBy: [desc(schema.posts.createdAt), desc(schema.posts.seq)] }),
    db.query.categories.findMany({ orderBy: [asc(schema.categories.name), asc(schema.categories.seq)] }),
    db.query.mediaItems.findMany({
      where: eq(schema.mediaItems.type, "image"),
      orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
    }),
  ]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const editing = edit ? await db.query.posts.findFirst({ where: eq(schema.posts.id, edit) }) : null;

  const filteredPosts = allPosts.filter((post) => {
    if (activeStatus !== "all" && post.status !== activeStatus) return false;
    if (q && !post.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const buildFilterHref = (nextStatus: string) => {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/bai-viet?${qs}` : "/admin/bai-viet";
  };

  return (
    <div>
      <AdminTopbar title="Bài viết" description="Quản lý tin tức & thông báo trên website" />
      {/* minmax(0,1fr): tiêu đề bài dài (truncate = không xuống dòng) không được kéo giãn cột danh sách, đẩy form bên phải ra ngoài. */}
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Danh sách bài viết */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({filteredPosts.length}/{allPosts.length})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => (
                <a
                  key={f.key}
                  href={buildFilterHref(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                    activeStatus === f.key
                      ? "bg-brand-700 text-white"
                      : "border border-line text-ink-soft hover:border-brand-500"
                  }`}
                >
                  {f.label}
                </a>
              ))}
              <form action="/admin/bai-viet" method="get" className="flex items-center gap-1.5">
                {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
                <input
                  type="text"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Tìm theo tiêu đề..."
                  className="w-40 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-brand-500"
                />
              </form>
            </div>
          </div>
          {filteredPosts.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              {allPosts.length === 0
                ? "Chưa có bài viết nào. Tạo bài viết đầu tiên ở form bên phải."
                : "Không tìm thấy bài viết phù hợp với bộ lọc."}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filteredPosts.map((post) => (
                // flex-wrap trên mobile: cụm nút Sửa/Đăng/Xoá xuống dòng riêng thay vì đẩy tràn khung (màn ~345px).
                <li key={post.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-6 py-4 sm:flex-nowrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-ink">{post.title}</span>
                      {!!post.isPinned && (
                        <span className="shrink-0 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700">
                          Đã ghim
                        </span>
                      )}
                      {!!post.attachmentUrl && (
                        <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                          📎 Đính kèm
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-faint">
                      <span>/{post.slug}</span>
                      {post.categoryId && categoryNameById.get(post.categoryId) && (
                        <span className="rounded-full bg-paper-alt px-2 py-0.5 font-sans text-[10.5px] font-semibold text-ink-soft">
                          {categoryNameById.get(post.categoryId)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        post.status === "published"
                          ? "bg-brand-100 text-brand-700"
                          : "bg-paper-alt text-ink-faint"
                      }`}
                    >
                      {post.status === "published" ? "Đã đăng" : "Bản nháp"}
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await togglePublishAction(
                          post.id,
                          post.status === "published" ? "draft" : "published"
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                      >
                        {post.status === "published" ? "Gỡ đăng" : "Đăng ngay"}
                      </button>
                    </form>
                    <a
                      href={`/admin/bai-viet?edit=${post.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deletePostAction(post.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá bài viết "${post.title}"? Không thể hoàn tác.`}
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

        <div className="flex h-fit flex-col gap-6">
          {/* Form thêm/sửa bài viết — id để Dashboard/Ctrl+K "Viết bài mới" nhảy thẳng tới */}
          <div id="form-bai-viet" className="scroll-mt-24 rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-900">
                {editing ? "Sửa bài viết" : "Viết bài mới"}
              </span>
              {editing && (
                <a href="/admin/bai-viet" className="text-xs font-semibold text-ink-faint hover:text-ink">
                  Huỷ sửa
                </a>
              )}
            </div>
            <form key={editing?.id ?? "new"} action={upsertPostAction} className="space-y-3.5">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Tiêu đề
                </label>
                <input
                  name="title"
                  required
                  defaultValue={editing?.title}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: Thông báo lịch thi cuối kỳ"
                />
                {editing && (
                  <p className="mt-1 font-mono text-[10.5px] text-ink-faint">
                    /{editing.slug} — đổi tiêu đề không đổi link này
                  </p>
                )}
              </div>
              <details className="rounded-lg border border-line p-3">
                <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                  🇬🇧 Bản tiếng Anh (tuỳ chọn)
                </summary>
                <div className="mt-3 space-y-3">
                  <AutoTranslateButton
                    pairs={[
                      { viName: "title", enName: "titleEn" },
                      { viName: "excerpt", enName: "excerptEn" },
                      { viName: "content", enName: "contentEn" },
                    ]}
                  />
                  <input
                    name="titleEn"
                    defaultValue={editing?.titleEn ?? ""}
                    placeholder="Title (English)"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    name="excerptEn"
                    defaultValue={editing?.excerptEn ?? ""}
                    placeholder="Short excerpt (English)"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                  <MarkdownEditor
                    name="contentEn"
                    rows={6}
                    defaultValue={editing?.contentEn ?? ""}
                    placeholder="Full content in English..."
                  />
                </div>
              </details>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink-soft">Danh mục</label>
                  <a
                    href="/admin/danh-muc"
                    className="text-[11px] font-semibold text-brand-700 hover:underline"
                  >
                    Quản lý danh mục
                  </a>
                </div>
                <select
                  name="categoryId"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  defaultValue={editing?.categoryId ?? ""}
                >
                  <option value="">— Không chọn —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Mô tả ngắn
                </label>
                <input
                  name="excerpt"
                  defaultValue={editing?.excerpt ?? ""}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="Tóm tắt 1 câu (tuỳ chọn)"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Ảnh đại diện (tuỳ chọn){editing ? " — để trống = giữ ảnh cũ" : ""}
                </label>
                <ImagePicker
                  spec="cover"
                  fileFieldName="coverImage"
                  pickedFieldName="coverImageExisting"
                  images={mediaImages}
                  currentUrl={editing?.coverImageUrl}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Tệp đính kèm (tuỳ chọn) — PDF/Word/Excel
                </label>
                {editing?.attachmentUrl && (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-line bg-paper-alt px-3 py-2 text-[12.5px]">
                    <a
                      href={editing.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-semibold text-brand-700 hover:underline"
                    >
                      📎 {editing.attachmentName || "Tệp đính kèm hiện tại"}
                    </a>
                    <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-accent-600">
                      <input type="checkbox" name="removeAttachment" className="h-3.5 w-3.5 rounded border-line" />
                      Xoá
                    </label>
                  </div>
                )}
                <CheckedFileInput
                  kinds={["document"]}
                  name="attachment"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-brand-700"
                />
                <p className="mt-1 text-[11px] text-ink-faint">
                  VD: quyết định tuyển sinh, biểu mẫu, đề cương — hiện link tải ngay dưới bài viết. Tối đa 20MB.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Nội dung
                </label>
                <MarkdownEditor
                  name="content"
                  required
                  rows={6}
                  defaultValue={editing?.content}
                  placeholder="Nội dung đầy đủ của bài viết..."
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                <input
                  type="checkbox"
                  name="isPinned"
                  defaultChecked={!!editing?.isPinned}
                  className="h-4 w-4 rounded border-line"
                />
                Ghim làm Thông báo nổi bật ở Trang chủ
              </label>
              {!editing && (
                <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <input type="checkbox" name="publishNow" className="h-4 w-4 rounded border-line" />
                  Đăng ngay (bỏ chọn = lưu bản nháp)
                </label>
              )}
              {editing && (
                <p className="text-[11px] text-ink-faint">
                  Trạng thái đăng/nháp không đổi qua form này — dùng nút &quot;Đăng ngay&quot;/&quot;Gỡ
                  đăng&quot; ở danh sách bên trái.
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
              >
                {editing ? "Lưu thay đổi" : "Lưu bài viết"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
