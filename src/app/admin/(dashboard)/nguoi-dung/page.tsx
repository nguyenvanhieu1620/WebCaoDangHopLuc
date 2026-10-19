import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { requirePermission, getUserPermissions } from "@/lib/admin-auth";
import { PERMISSION_MODULES } from "@/lib/constants";
import { formatVNDate } from "@/lib/utils";
import { paginate } from "@/lib/pagination";
import { deleteAdminUserAction } from "./actions";

export const metadata: Metadata = { title: "Người dùng" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  const currentUser = await requirePermission("users");
  const sp = await searchParams;
  const all = await db.query.adminUsers.findMany({ orderBy: [asc(schema.adminUsers.createdAt), asc(schema.adminUsers.seq)] });
  const pg = paginate(all, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Người dùng"
        description="Tài khoản đăng nhập khu vực quản trị + quyền truy cập từng phần"
        actions={<AdminNewButton href="/admin/nguoi-dung/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({all.length})</div>
          <ul className="divide-y divide-line">
            {pg.items.map((u) => {
              const perms = getUserPermissions(u);
              const isFull = perms === null;
              return (
                <li key={u.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/nguoi-dung/${u.id}`} className="truncate text-sm font-medium text-ink hover:text-brand-700">
                        {u.name}
                      </Link>
                      {u.id === currentUser.id && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700">Bạn</span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-ink-faint">{u.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isFull ? (
                        <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10.5px] font-semibold text-accent-700">Toàn quyền</span>
                      ) : perms!.length === 0 ? (
                        <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[10.5px] font-semibold text-ink-faint">Chưa có quyền nào</span>
                      ) : (
                        perms!.map((key) => (
                          <span key={key} className="rounded-full bg-paper-alt px-2 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                            {PERMISSION_MODULES.find((m) => m.key === key)?.label ?? key}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-ink-faint">Tạo lúc {formatVNDate(u.createdAt)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/nguoi-dung/${u.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    {u.id !== currentUser.id && (
                      <form
                        action={async () => {
                          "use server";
                          await deleteAdminUserAction(u.id);
                        }}
                      >
                        <ConfirmDeleteButton
                          className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                          confirmMessage={`Xoá tài khoản "${u.name}"? Không thể hoàn tác.`}
                        >
                          Xoá
                        </ConfirmDeleteButton>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <AdminPagination pagination={pg} basePath="/admin/nguoi-dung" unit="tài khoản" />
        </div>
      </div>
    </div>
  );
}
