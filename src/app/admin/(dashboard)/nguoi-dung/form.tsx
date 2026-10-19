import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { db, schema } from "@/lib/db";
import { requirePermission, getUserPermissions } from "@/lib/admin-auth";
import { PERMISSION_MODULES } from "@/lib/constants";
import { upsertAdminUserAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa tài khoản quản trị — dùng chung cho `them-moi/` và `[id]/`. */
export async function AdminUserFormPage({ id }: { id?: string }) {
  const currentUser = await requirePermission("users");
  const editing = id ? await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) }) : null;
  if (id && !editing) notFound();
  const editingPermissions = editing ? getUserPermissions(editing) : null;
  const isEditingSelf = editing?.id === currentUser.id;

  return (
    <AdminFormLayout
      title={editing ? `Sửa tài khoản: ${editing.name}` : "Thêm tài khoản"}
      description="Tài khoản đăng nhập khu vực quản trị + quyền truy cập từng phần"
      backHref="/admin/nguoi-dung"
    >
      <form action={upsertAdminUserAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-nguoi-dung-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Họ tên</label>
            <input
              id="f-nguoi-dung-name"
              name="name"
              required
              defaultValue={editing?.name}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="f-nguoi-dung-email" className="mb-1.5 block text-xs font-semibold text-ink-soft">Email đăng nhập</label>
            <input
              id="f-nguoi-dung-email"
              name="email"
              type="email"
              required
              defaultValue={editing?.email}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="f-nguoi-dung-password" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Mật khẩu {editing ? "(để trống nếu không đổi)" : ""}
          </label>
          <input
            id="f-nguoi-dung-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={!editing}
            minLength={8}
            placeholder={editing ? "••••••••" : "Tối thiểu 8 ký tự"}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500 sm:max-w-[50%]"
          />
        </div>
        <fieldset>
          <legend className="mb-1.5 block text-xs font-semibold text-ink-soft">Quyền truy cập từng phần</legend>
          {isEditingSelf && (
            <p className="mb-2 text-[11px] text-ink-faint">
              Đang sửa chính tài khoản của bạn — mục &quot;Người dùng&quot; luôn được giữ để tránh tự khoá quyền quản lý tài khoản.
            </p>
          )}
          <div className="grid grid-cols-1 gap-x-3 gap-y-2 rounded-lg border border-line p-3 sm:grid-cols-2 lg:grid-cols-3">
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
              Tài khoản này hiện là &quot;Toàn quyền&quot; (tạo trước khi có phân quyền) — bấm Lưu sẽ chuyển thành danh sách quyền
              cụ thể theo các ô đã tick ở trên.
            </p>
          )}
        </fieldset>
        <FormActions cancelHref="/admin/nguoi-dung" submitLabel={editing ? "Lưu thay đổi" : "Thêm tài khoản"} />
      </form>
    </AdminFormLayout>
  );
}
