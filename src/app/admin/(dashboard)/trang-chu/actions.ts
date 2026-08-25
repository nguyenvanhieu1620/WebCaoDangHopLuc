"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

const STAT_COUNT = 4;
const FEATURE_COUNT = 3;
const STEP_COUNT = 4;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) || "").trim();
}

export async function updateHomepageContentAction(formData: FormData) {
  await requirePermission("homepage");
  const heroBadge = field(formData, "heroBadge");
  const heroTitleLine1 = field(formData, "heroTitleLine1");
  const heroTitleLine2 = field(formData, "heroTitleLine2");
  const heroDescription = field(formData, "heroDescription");
  const heroBadge1Value = field(formData, "heroBadge1Value");
  const heroBadge1Label = field(formData, "heroBadge1Label");
  const heroBadge2Value = field(formData, "heroBadge2Value");
  const heroBadge2Label = field(formData, "heroBadge2Label");
  const ctaTitle = field(formData, "ctaTitle");
  const ctaDescription = field(formData, "ctaDescription");

  const heroBadgeEn = field(formData, "heroBadgeEn");
  const heroTitleLine1En = field(formData, "heroTitleLine1En");
  const heroTitleLine2En = field(formData, "heroTitleLine2En");
  const heroDescriptionEn = field(formData, "heroDescriptionEn");
  const heroBadge1LabelEn = field(formData, "heroBadge1LabelEn");
  const heroBadge2LabelEn = field(formData, "heroBadge2LabelEn");
  const ctaTitleEn = field(formData, "ctaTitleEn");
  const ctaDescriptionEn = field(formData, "ctaDescriptionEn");
  const missionText = field(formData, "missionText");
  const missionTextEn = field(formData, "missionTextEn");
  const visionText = field(formData, "visionText");
  const visionTextEn = field(formData, "visionTextEn");

  if (
    !heroBadge ||
    !heroTitleLine1 ||
    !heroTitleLine2 ||
    !heroDescription ||
    !heroBadge1Value ||
    !heroBadge1Label ||
    !heroBadge2Value ||
    !heroBadge2Label ||
    !ctaTitle ||
    !ctaDescription
  ) {
    return;
  }

  const current = await db.query.homepageContent.findFirst({
    where: eq(schema.homepageContent.id, "main"),
  });
  const heroImageUrl = await resolveImageUrl(
    formData,
    "heroImage",
    "heroImageExisting",
    current?.heroImageUrl ?? null
  );

  const stats = Array.from({ length: STAT_COUNT }, (_, i) => ({
    value: field(formData, `stat${i}_value`),
    label: field(formData, `stat${i}_label`),
  }));
  const features = Array.from({ length: FEATURE_COUNT }, (_, i) => ({
    title: field(formData, `feature${i}_title`),
    desc: field(formData, `feature${i}_desc`),
  }));
  const steps = Array.from({ length: STEP_COUNT }, (_, i) => ({
    title: field(formData, `step${i}_title`),
    desc: field(formData, `step${i}_desc`),
  }));

  const statsEn = Array.from({ length: STAT_COUNT }, (_, i) => ({
    label: field(formData, `stat${i}_label_en`),
  }));
  const featuresEn = Array.from({ length: FEATURE_COUNT }, (_, i) => ({
    title: field(formData, `feature${i}_title_en`),
    desc: field(formData, `feature${i}_desc_en`),
  }));
  const stepsEn = Array.from({ length: STEP_COUNT }, (_, i) => ({
    title: field(formData, `step${i}_title_en`),
    desc: field(formData, `step${i}_desc_en`),
  }));
  const hasContent = (items: Record<string, string>[]) =>
    items.some((item) => Object.values(item).some((v) => v));

  // Gộp toàn bộ field (kể cả các phần tử stats/features/steps) thành 1 mảng
  // pair để chỉ gọi autoFillTranslations (và DeepL) đúng 1 lần cho cả trang.
  const scalarPairs = [
    { vi: heroBadge, en: heroBadgeEn },
    { vi: heroTitleLine1, en: heroTitleLine1En },
    { vi: heroTitleLine2, en: heroTitleLine2En },
    { vi: heroDescription, en: heroDescriptionEn },
    { vi: heroBadge1Label, en: heroBadge1LabelEn },
    { vi: heroBadge2Label, en: heroBadge2LabelEn },
    { vi: ctaTitle, en: ctaTitleEn },
    { vi: ctaDescription, en: ctaDescriptionEn },
    { vi: missionText, en: missionTextEn },
    { vi: visionText, en: visionTextEn },
  ];
  const statsPairs = stats.map((s, i) => ({ vi: s.label, en: statsEn[i].label }));
  const featuresPairs = features.flatMap((f, i) => [
    { vi: f.title, en: featuresEn[i].title },
    { vi: f.desc, en: featuresEn[i].desc },
  ]);
  const stepsPairs = steps.flatMap((s, i) => [
    { vi: s.title, en: stepsEn[i].title },
    { vi: s.desc, en: stepsEn[i].desc },
  ]);

  const translated = await autoFillTranslations([
    ...scalarPairs,
    ...statsPairs,
    ...featuresPairs,
    ...stepsPairs,
  ]);

  let i = 0;
  const heroBadgeEnFinal = translated[i++];
  const heroTitleLine1EnFinal = translated[i++];
  const heroTitleLine2EnFinal = translated[i++];
  const heroDescriptionEnFinal = translated[i++];
  const heroBadge1LabelEnFinal = translated[i++];
  const heroBadge2LabelEnFinal = translated[i++];
  const ctaTitleEnFinal = translated[i++];
  const ctaDescriptionEnFinal = translated[i++];
  const missionTextEnFinal = translated[i++];
  const visionTextEnFinal = translated[i++];
  const statsEnFinal = stats.map(() => ({ label: translated[i++] }));
  const featuresEnFinal = features.map(() => ({ title: translated[i++], desc: translated[i++] }));
  const stepsEnFinal = steps.map(() => ({ title: translated[i++], desc: translated[i++] }));

  await db
    .update(schema.homepageContent)
    .set({
      heroImageUrl,
      heroBadge,
      heroBadgeEn: heroBadgeEnFinal || null,
      heroTitleLine1,
      heroTitleLine1En: heroTitleLine1EnFinal || null,
      heroTitleLine2,
      heroTitleLine2En: heroTitleLine2EnFinal || null,
      heroDescription,
      heroDescriptionEn: heroDescriptionEnFinal || null,
      heroBadge1Value,
      heroBadge1Label,
      heroBadge1LabelEn: heroBadge1LabelEnFinal || null,
      heroBadge2Value,
      heroBadge2Label,
      heroBadge2LabelEn: heroBadge2LabelEnFinal || null,
      statsJson: JSON.stringify(stats),
      statsJsonEn: hasContent(statsEnFinal) ? JSON.stringify(statsEnFinal) : null,
      featuresJson: JSON.stringify(features),
      featuresJsonEn: hasContent(featuresEnFinal) ? JSON.stringify(featuresEnFinal) : null,
      stepsJson: JSON.stringify(steps),
      stepsJsonEn: hasContent(stepsEnFinal) ? JSON.stringify(stepsEnFinal) : null,
      ctaTitle,
      ctaTitleEn: ctaTitleEnFinal || null,
      ctaDescription,
      ctaDescriptionEn: ctaDescriptionEnFinal || null,
      missionText: missionText || null,
      missionTextEn: missionTextEnFinal || null,
      visionText: visionText || null,
      visionTextEn: visionTextEnFinal || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.homepageContent.id, "main"));

  revalidatePath("/");
  revalidatePath("/admin/trang-chu");
}
