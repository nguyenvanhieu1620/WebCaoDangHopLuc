import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Category } from "@/lib/db/schema";

/** Danh mục bài viết — quản lý qua admin/bai-viet. */
export async function getCategories(): Promise<Category[]> {
  return db.query.categories.findMany({
    orderBy: asc(schema.categories.name),
  });
}
