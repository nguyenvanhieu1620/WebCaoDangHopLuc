import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Testimonial } from "@/lib/db/schema";

/** Đánh giá của cựu sinh viên hiển thị ở Trang chủ — quản lý qua admin/danh-gia. */
export async function getTestimonials(): Promise<Testimonial[]> {
  return db.query.testimonials.findMany({
    orderBy: asc(schema.testimonials.sortOrder),
  });
}
