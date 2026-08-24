import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";

export type StatItem = { value: string; label: string };
export type FeatureItem = { title: string; desc: string };
export type StepItem = { title: string; desc: string };

export type HomepageContent = {
  heroImageUrl: string | null;
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroBadge1Value: string;
  heroBadge1Label: string;
  heroBadge2Value: string;
  heroBadge2Label: string;
  stats: StatItem[];
  features: FeatureItem[];
  steps: StepItem[];
  ctaTitle: string;
  ctaDescription: string;
  missionText: string | null;
  visionText: string | null;
};

/**
 * Nội dung chữ ở Trang chủ (Hero, 4 chỉ số, 3 điểm mạnh, 4 bước quy trình,
 * CTA band) — quản lý qua admin/trang-chu, luôn chỉ 1 dòng duy nhất trong DB
 * (id "main"). Seed đảm bảo dòng này luôn tồn tại.
 */
/** Merge mảng bản dịch (theo index) vào mảng gốc — thiếu phần tử/field nào thì fallback tiếng Việt. */
function mergeArray<T extends Record<string, string>>(
  viJson: string,
  enJson: string | null,
  locale: "vi" | "en"
): T[] {
  const vi = JSON.parse(viJson) as T[];
  if (locale !== "en" || !enJson) return vi;
  let en: Partial<T>[] = [];
  try {
    en = JSON.parse(enJson) as Partial<T>[];
  } catch {
    return vi;
  }
  return vi.map((item, i) => {
    const enItem = en[i];
    if (!enItem) return item;
    const merged = { ...item };
    for (const key of Object.keys(item) as (keyof T)[]) {
      if (enItem[key]) merged[key] = enItem[key] as T[keyof T];
    }
    return merged;
  });
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const [row, locale] = await Promise.all([
    db.query.homepageContent.findFirst({ where: eq(schema.homepageContent.id, "main") }),
    getLocale(),
  ]);
  if (!row) {
    throw new Error(
      "Chưa có dữ liệu homepage_content — chạy `npm run db:seed` trước."
    );
  }
  return {
    heroImageUrl: row.heroImageUrl,
    heroBadge: pickLocale(row.heroBadge, row.heroBadgeEn, locale),
    heroTitleLine1: pickLocale(row.heroTitleLine1, row.heroTitleLine1En, locale),
    heroTitleLine2: pickLocale(row.heroTitleLine2, row.heroTitleLine2En, locale),
    heroDescription: pickLocale(row.heroDescription, row.heroDescriptionEn, locale),
    heroBadge1Value: row.heroBadge1Value,
    heroBadge1Label: pickLocale(row.heroBadge1Label, row.heroBadge1LabelEn, locale),
    heroBadge2Value: row.heroBadge2Value,
    heroBadge2Label: pickLocale(row.heroBadge2Label, row.heroBadge2LabelEn, locale),
    stats: mergeArray<StatItem>(row.statsJson, row.statsJsonEn, locale),
    features: mergeArray<FeatureItem>(row.featuresJson, row.featuresJsonEn, locale),
    steps: mergeArray<StepItem>(row.stepsJson, row.stepsJsonEn, locale),
    ctaTitle: pickLocale(row.ctaTitle, row.ctaTitleEn, locale),
    ctaDescription: pickLocale(row.ctaDescription, row.ctaDescriptionEn, locale),
    missionText: row.missionText ? pickLocale(row.missionText, row.missionTextEn, locale) : null,
    visionText: row.visionText ? pickLocale(row.visionText, row.visionTextEn, locale) : null,
  };
}
