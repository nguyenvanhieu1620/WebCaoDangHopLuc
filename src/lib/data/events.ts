import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import type { Event } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

function localize(e: Event, locale: "vi" | "en"): Event {
  return {
    ...e,
    title: pickLocale(e.title, e.titleEn, locale),
    description: e.description ? pickLocale(e.description, e.descriptionEn, locale) : e.description,
    location: e.location ? pickLocale(e.location, e.locationEn, locale) : e.location,
  };
}

/** Sự kiện, sắp xếp theo thời gian bắt đầu gần nhất trước — dùng cho /su-kien. Quản lý qua admin/su-kien. */
export async function getEvents(): Promise<Event[]> {
  const [rows, locale] = await Promise.all([
    db.query.events.findMany({ orderBy: asc(schema.events.startAt) }),
    getLocale(),
  ]);
  return rows.map((e) => localize(e, locale));
}

/** Lấy 1 sự kiện theo slug — dùng cho trang chi tiết /su-kien/[slug]. Trả về null nếu không tìm thấy. */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const [event, locale] = await Promise.all([
    db.query.events.findFirst({ where: eq(schema.events.slug, slug) }),
    getLocale(),
  ]);
  return event ? localize(event, locale) : null;
}
