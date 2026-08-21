"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { saveUploadedFileIfPresent } from "@/lib/media";

const STAT_COUNT = 4;
const FEATURE_COUNT = 3;
const STEP_COUNT = 4;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) || "").trim();
}

export async function updateHomepageContentAction(formData: FormData) {
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
  const heroImageUrl = await saveUploadedFileIfPresent(
    formData,
    "heroImage",
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

  await db
    .update(schema.homepageContent)
    .set({
      heroImageUrl,
      heroBadge,
      heroTitleLine1,
      heroTitleLine2,
      heroDescription,
      heroBadge1Value,
      heroBadge1Label,
      heroBadge2Value,
      heroBadge2Label,
      statsJson: JSON.stringify(stats),
      featuresJson: JSON.stringify(features),
      stepsJson: JSON.stringify(steps),
      ctaTitle,
      ctaDescription,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.homepageContent.id, "main"));

  revalidatePath("/");
  revalidatePath("/admin/trang-chu");
}
