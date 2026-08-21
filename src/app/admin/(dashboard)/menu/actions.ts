"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function upsertNavItemAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const href = String(formData.get("href") || "").trim();
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const isPrimary = formData.get("isPrimary") === "on" ? 1 : 0;
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!label || !href) return;

  if (id) {
    await db
      .update(schema.navItems)
      .set({ label, href, parentId, isPrimary, sortOrder })
      .where(eq(schema.navItems.id, id));
  } else {
    await db.insert(schema.navItems).values({ label, href, parentId, isPrimary, sortOrder });
  }

  revalidatePath("/admin/menu", "layout");
  revalidatePath("/", "layout");
}

export async function deleteNavItemAction(navItemId: string) {
  // Xoá cascade: xoá luôn mọi danh mục con thuộc danh mục to này (nếu có).
  const children = await db.query.navItems.findMany({
    where: eq(schema.navItems.parentId, navItemId),
  });
  for (const child of children) {
    await db.delete(schema.navItems).where(eq(schema.navItems.id, child.id));
  }
  await db.delete(schema.navItems).where(eq(schema.navItems.id, navItemId));

  revalidatePath("/admin/menu", "layout");
  revalidatePath("/", "layout");
}
