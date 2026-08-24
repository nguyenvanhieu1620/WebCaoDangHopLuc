import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
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
