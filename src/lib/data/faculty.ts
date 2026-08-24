import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import type { Faculty } from "@/lib/db/schema";
import { getLocale, pickLocale, type Locale } from "@/lib/locale";

function localize(f: Faculty, locale: Locale): Faculty {
  return {
    ...f,
    role: pickLocale(f.role, f.roleEn, locale),
    education: f.education ? pickLocale(f.education, f.educationEn, locale) : f.education,
    specialty: f.specialty ? pickLocale(f.specialty, f.specialtyEn, locale) : f.specialty,
    bio: f.bio ? pickLocale(f.bio, f.bioEn, locale) : f.bio,
  };
}

/** Đội ngũ giảng viên hiển thị ở Trang chủ và /doi-ngu-giang-vien — quản lý qua admin/giang-vien. */
export async function getFacultyList(): Promise<Faculty[]> {
  const [rows, locale] = await Promise.all([
    db.query.faculty.findMany({ orderBy: asc(schema.faculty.sortOrder) }),
    getLocale(),
  ]);
  return rows.map((f) => localize(f, locale));
}

/** 1 giảng viên theo slug — dùng cho trang chi tiết /doi-ngu-giang-vien/[slug]. Trả về null nếu không tìm thấy. */
export async function getFacultyBySlug(slug: string): Promise<Faculty | null> {
  const [row, locale] = await Promise.all([
    db.query.faculty.findFirst({ where: eq(schema.faculty.slug, slug) }),
    getLocale(),
  ]);
  return row ? localize(row, locale) : null;
}
