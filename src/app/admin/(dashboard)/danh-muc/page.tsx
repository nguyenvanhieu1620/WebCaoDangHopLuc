import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deleteCategoryAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Danh mục bài viết" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("posts");
  const sp = await searchParams;
  const [categories, posts] = await Promise.all([
    db.query.categories.findMany({ orderBy: [asc(schema.categories.name), asc(schema.categories.seq)] }),
    db.query.posts.findMany({ columns: { categoryId: true } }),
  ]);
  const postCount = new Map<string, number>();
  for (const p of posts) if (p.categoryId) postCount.set(p.categoryId, (postCount.get(p.categoryId) ?? 0) + 1);
  const pg = paginate(categories, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Danh mục bài viết"
        description="Dùng để phân loại Bài viết — chọn qua ô Danh mục khi viết bài"
        actions={<AdminNewButton href="/admin/danh-muc/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({categories.length})</div>
          {categories.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có danh mục nào.{" "}
              <Link href="/admin/danh-muc/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm danh mục đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <Link href={`/admin/danh-muc/${c.id}`} className="text-sm font-medium text-ink hover:text-brand-700">
                      {c.name}
                    </Link>
                    <span className="font-mono text-[11px] text-ink-faint">?category={c.slug}</span>
                    <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                      {postCount.get(c.id) ?? 0} bài viết
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/danh-muc/${c.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteCategoryAction(c.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá danh mục "${c.name}"? Bài viết đang gắn danh mục này sẽ không còn danh mục.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/danh-muc" unit="danh mục" />
        </div>
      </div>
    </div>
  );
}
