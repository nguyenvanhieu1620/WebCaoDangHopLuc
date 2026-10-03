import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";
import { hasPlaceholder } from "@/lib/utils";

export type MilestoneEntry = {
  id: string;
  period: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export type MilestoneYear = { year: number; items: MilestoneEntry[] };

/**
 * Cột mốc phát triển cho dòng thời gian ở /gioi-thieu, nhóm theo năm (năm tăng
 * dần, trong năm theo `sortOrder`). Mốc có tiêu đề còn ghi chú `[Trường điền …]`
 * bị ẩn hẳn; mô tả/thời điểm còn ghi chú thì bỏ trống — không lộ ghi chú nội bộ
 * ra web công khai (quy ước #13 CLAUDE.md).
 */
export async function getMilestoneYears(): Promise<MilestoneYear[]> {
  const [rows, locale] = await Promise.all([
    db.query.milestones.findMany({
      orderBy: [asc(schema.milestones.year), asc(schema.milestones.sortOrder), asc(schema.milestones.createdAt)],
    }),
    getLocale(),
  ]);

  const byYear = new Map<number, MilestoneEntry[]>();
  for (const r of rows) {
    const title = pickLocale(r.title, r.titleEn, locale);
    if (hasPlaceholder(title)) continue;
    const description = r.description ? pickLocale(r.description, r.descriptionEn, locale) : null;
    const period = r.period ? pickLocale(r.period, r.periodEn, locale) : null;
    const entry: MilestoneEntry = {
      id: r.id,
      title,
      description: description && !hasPlaceholder(description) ? description : null,
      period: period && !hasPlaceholder(period) ? period : null,
      imageUrl: r.imageUrl,
    };
    byYear.set(r.year, [...(byYear.get(r.year) ?? []), entry]);
  }
  return [...byYear.entries()].map(([year, items]) => ({ year, items }));
}
