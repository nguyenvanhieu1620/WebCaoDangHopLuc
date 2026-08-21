import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { getCategories } from "@/lib/data/categories";
import {
  createPostAction,
  togglePublishAction,
  deletePostAction,
  createCategoryAction,
  deleteCategoryAction,
} from "./actions";

export const metadata: Metadata = { title: "Quản lý bài viết" };

export default async function AdminPostsPage() {
  const [allPosts, categories] = await Promise.all([
    db.query.posts.findMany({ orderBy: desc(schema.posts.createdAt) }),
    getCategories(),
  ]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <AdminTopbar title="Bài viết" description="Quản lý tin tức & thông báo trên website" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_360px]">
        {/* Danh sách bài viết */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allPosts.length})
            </span>
          </div>
          {allPosts.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có bài viết nào. Tạo bài viết đầu tiên ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allPosts.map((post) => (
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
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                      >
                        Xoá
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex h-fit flex-col gap-6">
          {/* Danh mục */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-3 text-sm font-semibold text-brand-900">Danh mục</div>
            {categories.length > 0 && (
              <ul className="mb-3.5 space-y-1.5">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-paper-alt px-3 py-2 text-[13px]"
                  >
                    <span className="font-medium text-ink">{c.name}</span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteCategoryAction(c.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-[11px] font-semibold text-accent-600 hover:underline"
                      >
                        Xoá
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={createCategoryAction} className="flex gap-2">
              <input
                name="categoryName"
                required
                placeholder="Tên danh mục mới"
                className="flex-1 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-700 px-3.5 py-2 text-[13px] font-semibold text-white"
              >
                Thêm
              </button>
            </form>
          </div>

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
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Danh mục
                </label>
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
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  className="w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Nội dung
                </label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
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
