import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Faculty } from "@/lib/db/schema";

/** Đội ngũ giảng viên hiển thị ở Trang chủ — quản lý qua admin/giang-vien. */
export async function getFacultyList(): Promise<Faculty[]> {
  return db.query.faculty.findMany({
    orderBy: asc(schema.faculty.sortOrder),
  });
}
