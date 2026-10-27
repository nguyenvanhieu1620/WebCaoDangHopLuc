import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc, desc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { togglePublishAction, deletePostAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { normalizeSearch } from "@/lib/utils";

export const metadata: Metadata = { title: "Quản lý bài viết" };

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "published", label: "Đã đăng" },
  { key: "draft", label: "Bản nháp" },
] as const;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; saved?: string }>;
}) {
  await requirePermission("posts");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const activeStatus = sp.status === "published" || sp.status === "draft" ? sp.status : "all";

  const [allPosts, categories] = await Promise.all([
    db.query.posts.findMany({ orderBy: [desc(schema.posts.createdAt), desc(schema.posts.seq)] }),
    db.query.categories.findMany({ orderBy: [asc(schema.categories.name), asc(schema.categories.seq)] }),
  ]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const filteredPosts = allPosts.filter((post) => {
    if (activeStatus !== "all" && post.status !== activeStatus) return false;
    if (q && !normalizeSearch(post.title).includes(normalizeSearch(q))) return false;
    return true;
  });
  const pg = paginate(filteredPosts, sp.page);

  const buildFilterHref = (nextStatus: string) => {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/bai-viet?${qs}` : "/admin/bai-viet";
  };

  return (
    <div>
      <AdminTopbar
        title="Bài viết"
        description="Quản lý tin tức & thông báo trên website"
        actions={<AdminNewButton href="/admin/bai-viet/them-moi" label="Viết bài mới" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({filteredPosts.length}/{allPosts.length})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={buildFilterHref(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                    activeStatus === f.key ? "bg-brand-700 text-white" : "border border-line text-ink-soft hover:border-brand-500"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
              <form action="/admin/bai-viet" method="get" className="flex items-center gap-1.5">
                {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
                <input
                  aria-label="Tìm theo tiêu đề"
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Tìm theo tiêu đề..."
                  className="w-44 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-brand-500"
                />
              </form>
            </div>
          </div>
          {filteredPosts.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              {allPosts.length === 0 ? (
                <>
                  Chưa có bài viết nào.{" "}
                  <Link href="/admin/bai-viet/them-moi" className="font-semibold text-brand-700 hover:underline">
                    Viết bài đầu tiên
                  </Link>
                </>
              ) : (
                "Không tìm thấy bài viết phù hợp với bộ lọc."
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((post) => (
                // flex-wrap trên mobile: cụm nút Sửa/Đăng/Xoá xuống dòng riêng thay vì đẩy tràn khung (màn ~345px).
                <li key={post.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-6 py-4 sm:flex-nowrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/bai-viet/${post.id}`} className="truncate text-sm font-medium text-ink hover:text-brand-700">
                        {post.title}
                      </Link>
                      {!!post.isPinned && (
                        <span className="shrink-0 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700">Đã ghim</span>
                      )}
                      {!!post.attachmentUrl && (
                        <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">📎 Đính kèm</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-faint">
                      <span className="truncate">/{post.slug}</span>
                      {post.categoryId && categoryNameById.get(post.categoryId) && (
                        <span className="shrink-0 rounded-full bg-paper-alt px-2 py-0.5 font-sans text-[10.5px] font-semibold text-ink-soft">
                          {categoryNameById.get(post.categoryId)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        post.status === "published" ? "bg-brand-100 text-brand-700" : "bg-paper-alt text-ink-faint"
                      }`}
                    >
                      {post.status === "published" ? "Đã đăng" : "Bản nháp"}
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await togglePublishAction(post.id, post.status === "published" ? "draft" : "published");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                      >
                        {post.status === "published" ? "Gỡ đăng" : "Đăng ngay"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/bai-viet/${post.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
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
          <AdminPagination
            pagination={pg}
            basePath="/admin/bai-viet"
            params={{ status: activeStatus === "all" ? undefined : activeStatus, q: q || undefined }}
            unit="bài viết"
          />
        </div>
      </div>
    </div>
  );
}
