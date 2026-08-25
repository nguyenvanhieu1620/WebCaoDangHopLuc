import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { requirePermission, getUserPermissions } from "@/lib/admin-auth";
import { PERMISSION_MODULES } from "@/lib/constants";
import { formatVNDate } from "@/lib/utils";
import { upsertAdminUserAction, deleteAdminUserAction } from "./actions";

export const metadata: Metadata = { title: "Người dùng" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const currentUser = await requirePermission("users");
  const { edit } = await searchParams;

  const all = await db.query.adminUsers.findMany({ orderBy: asc(schema.adminUsers.createdAt) });
  const editing = edit ? await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, edit) }) : null;

  const editingPermissions = editing ? getUserPermissions(editing) : null;
  const isEditingSelf = editing?.id === currentUser.id;

  return (
    <div>
      <AdminTopbar
        title="Người dùng"
        description="Tài khoản đăng nhập khu vực quản trị + quyền truy cập từng phần"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_460px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">Danh sách ({all.length})</span>
          </div>
          <ul className="divide-y divide-line">
            {all.map((u) => {
              const perms = getUserPermissions(u);
              const isFull = perms === null;
              return (
                <li key={u.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-ink-faint">{u.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isFull ? (
                        <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10.5px] font-semibold text-accent-700">
                          Toàn quyền
                        </span>
                      ) : perms!.length === 0 ? (
                        <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[10.5px] font-semibold text-ink-faint">
                          Chưa có quyền nào
                        </span>
                      ) : (
                        perms!.map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-paper-alt px-2 py-0.5 text-[10.5px] font-semibold text-ink-soft"
                          >
                            {PERMISSION_MODULES.find((m) => m.key === key)?.label ?? key}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-ink-faint">
                      Tạo lúc {formatVNDate(u.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/nguoi-dung?edit=${u.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
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
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? "Sửa tài khoản" : "Thêm tài khoản"}
            </span>
            {editing && (
              <a href="/admin/nguoi-dung" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertAdminUserAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Họ tên</label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Email đăng nhập</label>
              <input
                name="email"
                type="email"
                required
                defaultValue={editing?.email}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Mật khẩu {editing ? "(để trống nếu không đổi)" : ""}
              </label>
              <input
                name="password"
                type="password"
                required={!editing}
                minLength={8}
                placeholder={editing ? "••••••••" : "Tối thiểu 8 ký tự"}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Quyền truy cập từng phần
              </label>
              {isEditingSelf && (
                <p className="mb-2 text-[11px] text-ink-faint">
                  Đang sửa chính tài khoản của bạn — mục &quot;Người dùng&quot; luôn được giữ để tránh tự khoá quyền quản lý tài khoản.
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-line p-3">
                {PERMISSION_MODULES.map((m) => {
                  const checked = editing ? editingPermissions === null || editingPermissions.includes(m.key) : false;
                  const lockedOn = isEditingSelf && m.key === "users";
                  return (
                    <label key={m.key} className="flex items-center gap-2 text-[13px] text-ink">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={m.key}
                        defaultChecked={checked}
                        disabled={lockedOn}
                        className="h-3.5 w-3.5 rounded border-line accent-brand-600"
                      />
                      {m.label}
                    </label>
                  );
                })}
              </div>
              {editing && editingPermissions === null && (
                <p className="mt-2 text-[11px] text-ink-faint">
                  Tài khoản này hiện là &quot;Toàn quyền&quot; (tạo trước khi có phân quyền) — bấm Lưu sẽ chuyển
                  thành danh sách quyền cụ thể theo các ô đã tick ở trên.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm tài khoản"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
