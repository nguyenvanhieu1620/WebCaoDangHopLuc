"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requirePermission, getUserPermissions } from "@/lib/admin-auth";
import { PERMISSION_MODULES } from "@/lib/constants";
import { redirect } from "next/navigation";

const VALID_KEYS = new Set(PERMISSION_MODULES.map((m) => m.key));

export async function upsertAdminUserAction(formData: FormData) {
  const currentUser = await requirePermission("users");

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const permissions = formData
    .getAll("permissions")
    .map((v) => String(v))
    .filter((key) => VALID_KEYS.has(key));

  if (!name || !email) return;
  if (!id && !password) return; // tạo mới bắt buộc có mật khẩu

  // Không cho tự gỡ quyền "users" khỏi chính tài khoản đang đăng nhập —
  // tránh tự khoá mất quyền quản lý người dùng của chính mình.
  const finalPermissions =
    id === currentUser.id && !permissions.includes("users")
      ? [...permissions, "users"]
      : permissions;

  if (id) {
    const values: Partial<typeof schema.adminUsers.$inferInsert> = {
      name,
      email,
      permissions: JSON.stringify(finalPermissions),
    };
    if (password) values.passwordHash = await hashPassword(password);
    await db.update(schema.adminUsers).set(values).where(eq(schema.adminUsers.id, id));
  } else {
    const existing = await db.query.adminUsers.findFirst({
      where: (u, { eq: eqOp }) => eqOp(u.email, email),
    });
    if (existing) return; // email đã tồn tại

    await db.insert(schema.adminUsers).values({
      name,
      email,
      passwordHash: await hashPassword(password),
      permissions: JSON.stringify(finalPermissions),
    });
  }

  revalidatePath("/admin/nguoi-dung");

  redirect("/admin/nguoi-dung");
}

export async function deleteAdminUserAction(id: string) {
  const currentUser = await requirePermission("users");

  if (id === currentUser.id) return; // không tự xoá chính mình

  const target = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  if (!target) return;

  // Nếu đây là tài khoản có quyền "users" cuối cùng, chặn xoá — tránh cả hệ
  // thống mất hết khả năng vào Quản lý người dùng.
  if (getUserPermissions(target) === null || getUserPermissions(target)!.includes("users")) {
    const all = await db.query.adminUsers.findMany();
    const otherUserManagers = all.filter((u) => {
      if (u.id === id) return false;
      const p = getUserPermissions(u);
      return p === null || p.includes("users");
    });
    if (otherUserManagers.length === 0) return;
  }

  await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id));
  revalidatePath("/admin/nguoi-dung");
}
