import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { createPostAction, togglePublishAction, deletePostAction } from "./actions";
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
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requirePermission("posts");
  const { q, status } = await searchParams;
  const activeStatus = status === "published" || status === "draft" ? status : "all";

  const [allPosts, categories, mediaImages] = await Promise.all([
    db.query.posts.findMany({ orderBy: desc(schema.posts.createdAt) }),
    db.query.categories.findMany({ orderBy: asc(schema.categories.name) }),
    db.query.mediaItems.findMany({
      where: eq(schema.mediaItems.type, "image"),
      orderBy: desc(schema.mediaItems.createdAt),
    }),
  ]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

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
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_360px]">
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
                <li key={post.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{post.title}</div>
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
          {/* Form tạo bài viết mới */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 text-sm font-semibold text-brand-900">Viết bài mới</div>
            <form action={createPostAction} className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Tiêu đề
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: Thông báo lịch thi cuối kỳ"
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
                      { viName: "excerpt", enName: "excerptEn" },
                      { viName: "content", enName: "contentEn" },
                    ]}
                  />
                  <input
                    name="titleEn"
                    placeholder="Title (English)"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    name="excerptEn"
                    placeholder="Short excerpt (English)"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                  <MarkdownEditor name="contentEn" rows={6} placeholder="Full content in English..." />
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
                  defaultValue=""
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
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="Tóm tắt 1 câu (tuỳ chọn)"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Ảnh đại diện (tuỳ chọn)
                </label>
                <ImagePicker
                  fileFieldName="coverImage"
                  pickedFieldName="coverImageExisting"
                  images={mediaImages}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Nội dung
                </label>
                <MarkdownEditor
                  name="content"
                  required
                  rows={6}
                  placeholder="Nội dung đầy đủ của bài viết..."
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                <input type="checkbox" name="publishNow" className="h-4 w-4 rounded border-line" />
                Đăng ngay (bỏ chọn = lưu bản nháp)
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
              >
                Lưu bài viết
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
