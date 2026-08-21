import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Partner } from "@/lib/db/schema";

/** Đối tác hiển thị ở dải Trang chủ — quản lý qua admin/doi-tac. */
export async function getPartners(): Promise<Partner[]> {
  return db.query.partners.findMany({
    orderBy: asc(schema.partners.sortOrder),
  });
}
