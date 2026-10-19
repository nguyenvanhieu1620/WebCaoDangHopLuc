import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deleteNavItemAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Menu chính" };

const smallBtn = "rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold";

/** Danh mục to (kèm các danh mục con) — phân trang theo danh mục to. */
export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("menu");
  const sp = await searchParams;
  const allItems = await db.query.navItems.findMany({
    orderBy: [asc(schema.navItems.sortOrder), asc(schema.navItems.seq)],
  });
  const topLevel = allItems.filter((i) => !i.parentId);
  const childrenOf = (parentId: string) => allItems.filter((i) => i.parentId === parentId);
  const pg = paginate(topLevel, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Menu chính"
        description="Danh mục to/con hiển thị ở menu điều hướng trang công khai"
        actions={<AdminNewButton href="/admin/menu/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">
            Danh mục to ({topLevel.length}) · {allItems.length - topLevel.length} danh mục con
          </div>
          {topLevel.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có mục menu nào.{" "}
              <Link href="/admin/menu/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm mục đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((item) => {
                const children = childrenOf(item.id);
                return (
                  <li key={item.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/menu/${item.id}`} className="text-sm font-medium text-ink hover:text-brand-700">
                            {item.label}
                          </Link>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.isPrimary === 1 ? "bg-brand-100 text-brand-700" : "bg-paper-alt text-ink-faint"
                            }`}
                          >
                            {item.isPrimary === 1 ? "Menu chính" : "Danh mục khác (☰)"}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                          {item.href} · vị trí #{item.sortOrder}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <Link href={`/admin/menu/them-moi?parent=${item.id}`} className={`${smallBtn} text-brand-700 hover:border-brand-500`}>
                          + Mục con
                        </Link>
                        <Link href={`/admin/menu/${item.id}`} className={`${smallBtn} text-ink-soft hover:border-brand-500 hover:text-brand-700`}>
                          Sửa
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await deleteNavItemAction(item.id);
                          }}
                        >
                          <ConfirmDeleteButton
                            className={`${smallBtn} text-accent-600 hover:border-accent-500`}
                            confirmMessage={
                              children.length > 0
                                ? `Xoá "${item.label}" sẽ xoá luôn ${children.length} danh mục con của nó. Không thể hoàn tác.`
                                : `Xoá mục menu "${item.label}"? Không thể hoàn tác.`
                            }
                          >
                            Xoá
                          </ConfirmDeleteButton>
                        </form>
                      </div>
                    </div>
                    {children.length > 0 && (
                      <ul className="mt-3 space-y-2 border-l-2 border-line pl-4">
                        {children.map((child) => (
                          <li key={child.id} className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <Link href={`/admin/menu/${child.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700">
                                {child.label}
                              </Link>
                              <div className="font-mono text-[10.5px] text-ink-faint">
                                {child.href} · vị trí #{child.sortOrder}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Link
                                href={`/admin/menu/${child.id}`}
                                className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                              >
                                Sửa
                              </Link>
                              <form
                                action={async () => {
                                  "use server";
                                  await deleteNavItemAction(child.id);
                                }}
                              >
                                <ConfirmDeleteButton
                                  className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-accent-600 hover:border-accent-500"
                                  confirmMessage={`Xoá danh mục con "${child.label}"? Không thể hoàn tác.`}
                                >
                                  Xoá
                                </ConfirmDeleteButton>
                              </form>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/menu" unit="danh mục to" />
        </div>
      </div>
    </div>
  );
}
