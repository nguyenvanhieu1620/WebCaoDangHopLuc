import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type StatItem = { value: string; label: string };
export type FeatureItem = { title: string; desc: string };
export type StepItem = { title: string; desc: string };

export type HomepageContent = {
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroImageCardLabel: string;
  heroImageCardTitle: string;
  heroRatingValue: string;
  heroRatingText: string;
  stats: StatItem[];
  features: FeatureItem[];
  steps: StepItem[];
  ctaTitle: string;
  ctaDescription: string;
};

/**
 * Nội dung chữ ở Trang chủ (Hero, 4 chỉ số, 3 điểm mạnh, 4 bước quy trình,
 * CTA band) — quản lý qua admin/trang-chu, luôn chỉ 1 dòng duy nhất trong DB
 * (id "main"). Seed đảm bảo dòng này luôn tồn tại.
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  const row = await db.query.homepageContent.findFirst({
    where: eq(schema.homepageContent.id, "main"),
  });
  if (!row) {
    throw new Error(
      "Chưa có dữ liệu homepage_content — chạy `npm run db:seed` trước."
    );
  }
  return {
    heroBadge: row.heroBadge,
    heroTitleLine1: row.heroTitleLine1,
    heroTitleLine2: row.heroTitleLine2,
    heroDescription: row.heroDescription,
    heroImageCardLabel: row.heroImageCardLabel,
    heroImageCardTitle: row.heroImageCardTitle,
    heroRatingValue: row.heroRatingValue,
    heroRatingText: row.heroRatingText,
    stats: JSON.parse(row.statsJson) as StatItem[],
    features: JSON.parse(row.featuresJson) as FeatureItem[],
    steps: JSON.parse(row.stepsJson) as StepItem[],
    ctaTitle: row.ctaTitle,
    ctaDescription: row.ctaDescription,
  };
}
