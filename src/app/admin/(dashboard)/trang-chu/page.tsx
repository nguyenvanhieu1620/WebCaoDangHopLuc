import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { updateHomepageContentAction } from "./actions";

type ArrayItem = Record<string, string>;

function parseArray(json: string | null): ArrayItem[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as ArrayItem[];
  } catch {
    return [];
  }
}

export const metadata: Metadata = { title: "Nội dung Trang chủ" };

const inputClass =
  "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";
const labelClass = "mb-1.5 block text-xs font-semibold text-ink-soft";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {title}
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

export default async function AdminHomepagePage() {
  const [row, mediaImages] = await Promise.all([
    db.query.homepageContent.findFirst({ where: eq(schema.homepageContent.id, "main") }),
    db.query.mediaItems.findMany({
      where: eq(schema.mediaItems.type, "image"),
      orderBy: desc(schema.mediaItems.createdAt),
    }),
  ]);
  if (!row) {
    throw new Error("Chưa có dữ liệu homepage_content — chạy `npm run db:seed` trước.");
  }
  const content = {
    ...row,
    stats: parseArray(row.statsJson),
    features: parseArray(row.featuresJson),
    steps: parseArray(row.stepsJson),
  };
  const statsEn = parseArray(row.statsJsonEn);
  const featuresEn = parseArray(row.featuresJsonEn);
  const stepsEn = parseArray(row.stepsJsonEn);

  const allEnglishPairs = [
    { viName: "heroBadge", enName: "heroBadgeEn" },
    { viName: "heroTitleLine1", enName: "heroTitleLine1En" },
    { viName: "heroTitleLine2", enName: "heroTitleLine2En" },
    { viName: "heroDescription", enName: "heroDescriptionEn" },
    { viName: "heroBadge1Label", enName: "heroBadge1LabelEn" },
    { viName: "heroBadge2Label", enName: "heroBadge2LabelEn" },
    ...content.stats.map((_, i) => ({ viName: `stat${i}_label`, enName: `stat${i}_label_en` })),
    ...content.features.flatMap((_, i) => [
      { viName: `feature${i}_title`, enName: `feature${i}_title_en` },
      { viName: `feature${i}_desc`, enName: `feature${i}_desc_en` },
    ]),
    ...content.steps.flatMap((_, i) => [
      { viName: `step${i}_title`, enName: `step${i}_title_en` },
      { viName: `step${i}_desc`, enName: `step${i}_desc_en` },
    ]),
    { viName: "ctaTitle", enName: "ctaTitleEn" },
    { viName: "ctaDescription", enName: "ctaDescriptionEn" },
    { viName: "missionText", enName: "missionTextEn" },
    { viName: "visionText", enName: "visionTextEn" },
  ];

  return (
    <div>
      <AdminTopbar
        title="Nội dung Trang chủ"
        description="Chỉnh nội dung chữ ở Hero, chỉ số, điểm mạnh, quy trình, CTA — số lượng mục cố định (4/3/4) để không vỡ layout"
      />
      <div className="p-8">
        <form
          action={updateHomepageContentAction}
          className="max-w-3xl space-y-6 rounded-2xl border border-line bg-white p-6"
        >
          <AutoTranslateButton
            pairs={allEnglishPairs}
            label="Dịch toàn bộ nội dung Trang chủ sang tiếng Anh"
          />

          <FormSection title="Hero">
            <div>
              <label className={labelClass}>Badge nhỏ trên tiêu đề</label>
              <input name="heroBadge" required defaultValue={content.heroBadge} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tiêu đề dòng 1</label>
                <input
                  name="heroTitleLine1"
                  required
                  defaultValue={content.heroTitleLine1}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Tiêu đề dòng 2 (chữ nhấn đỏ)</label>
                <input
                  name="heroTitleLine2"
                  required
                  defaultValue={content.heroTitleLine2}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Mô tả</label>
              <textarea
                name="heroDescription"
                required
                rows={3}
                defaultValue={content.heroDescription}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ảnh Hero (để trống = giữ ảnh cũ)</label>
              <ImagePicker
                fileFieldName="heroImage"
                pickedFieldName="heroImageExisting"
                images={mediaImages}
                currentUrl={content.heroImageUrl}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Badge nổi 1 — số liệu (VD: &quot;12+&quot;)</label>
                <input
                  name="heroBadge1Value"
                  required
                  defaultValue={content.heroBadge1Value}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Badge nổi 1 — nhãn</label>
                <input
                  name="heroBadge1Label"
                  required
                  defaultValue={content.heroBadge1Label}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Badge nổi 2 — số liệu (VD: &quot;96%&quot;)</label>
                <input
                  name="heroBadge2Value"
                  required
                  defaultValue={content.heroBadge2Value}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Badge nổi 2 — nhãn</label>
                <input
                  name="heroBadge2Label"
                  required
                  defaultValue={content.heroBadge2Label}
                  className={inputClass}
                />
              </div>
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <input
                  name="heroBadgeEn"
                  defaultValue={row.heroBadgeEn ?? ""}
                  placeholder="Badge (English)"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="heroTitleLine1En"
                    defaultValue={row.heroTitleLine1En ?? ""}
                    placeholder="Title line 1 (English)"
                    className={inputClass}
                  />
                  <input
                    name="heroTitleLine2En"
                    defaultValue={row.heroTitleLine2En ?? ""}
                    placeholder="Title line 2 (English)"
                    className={inputClass}
                  />
                </div>
                <textarea
                  name="heroDescriptionEn"
                  rows={3}
                  defaultValue={row.heroDescriptionEn ?? ""}
                  placeholder="Description (English)"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="heroBadge1LabelEn"
                    defaultValue={row.heroBadge1LabelEn ?? ""}
                    placeholder="Badge 1 label (English)"
                    className={inputClass}
                  />
                  <input
                    name="heroBadge2LabelEn"
                    defaultValue={row.heroBadge2LabelEn ?? ""}
                    placeholder="Badge 2 label (English)"
                    className={inputClass}
                  />
                </div>
              </div>
            </details>
          </FormSection>

          <FormSection title="Sứ mệnh - Tầm nhìn (tuỳ chọn — để trống thì ẩn cả khối này ở Trang chủ)">
            <div>
              <label className={labelClass}>Sứ mệnh</label>
              <textarea
                name="missionText"
                rows={3}
                defaultValue={row.missionText ?? ""}
                className={inputClass}
                placeholder="VD: Đào tạo nguồn nhân lực y dược chất lượng cao, gắn lý thuyết với thực hành lâm sàng..."
              />
            </div>
            <div>
              <label className={labelClass}>Tầm nhìn</label>
              <textarea
                name="visionText"
                rows={3}
                defaultValue={row.visionText ?? ""}
                className={inputClass}
                placeholder="VD: Trở thành trường cao đẳng y dược hàng đầu khu vực Bắc Trung Bộ vào năm 2030..."
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "missionText", enName: "missionTextEn" },
                    { viName: "visionText", enName: "visionTextEn" },
                  ]}
                />
                <textarea
                  name="missionTextEn"
                  rows={3}
                  defaultValue={row.missionTextEn ?? ""}
                  placeholder="Mission (English)"
                  className={inputClass}
                />
                <textarea
                  name="visionTextEn"
                  rows={3}
                  defaultValue={row.visionTextEn ?? ""}
                  placeholder="Vision (English)"
                  className={inputClass}
                />
              </div>
            </details>
          </FormSection>

          <FormSection title="4 chỉ số thống kê">
            {content.stats.map((s, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-line p-3">
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <div>
                    <label className={labelClass}>Số liệu</label>
                    <input name={`stat${i}_value`} required defaultValue={s.value} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nhãn</label>
                    <input name={`stat${i}_label`} required defaultValue={s.label} className={inputClass} />
                  </div>
                </div>
                <details>
                  <summary className="cursor-pointer text-[11px] font-semibold text-ink-soft">
                    🇬🇧 Nhãn tiếng Anh (tuỳ chọn)
                  </summary>
                  <input
                    name={`stat${i}_label_en`}
                    defaultValue={statsEn[i]?.label ?? ""}
                    placeholder="Label (English)"
                    className={`${inputClass} mt-2`}
                  />
                </details>
              </div>
            ))}
          </FormSection>

          <FormSection title="3 điểm mạnh">
            {content.features.map((f, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-line p-3">
                <div>
                  <label className={labelClass}>Tiêu đề</label>
                  <input name={`feature${i}_title`} required defaultValue={f.title} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mô tả</label>
                  <textarea
                    name={`feature${i}_desc`}
                    required
                    rows={2}
                    defaultValue={f.desc}
                    className={inputClass}
                  />
                </div>
                <details>
                  <summary className="cursor-pointer text-[11px] font-semibold text-ink-soft">
                    🇬🇧 Bản tiếng Anh (tuỳ chọn)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <input
                      name={`feature${i}_title_en`}
                      defaultValue={featuresEn[i]?.title ?? ""}
                      placeholder="Title (English)"
                      className={inputClass}
                    />
                    <textarea
                      name={`feature${i}_desc_en`}
                      rows={2}
                      defaultValue={featuresEn[i]?.desc ?? ""}
                      placeholder="Description (English)"
                      className={inputClass}
                    />
                  </div>
                </details>
              </div>
            ))}
          </FormSection>

          <FormSection title="4 bước quy trình xét tuyển">
            {content.steps.map((s, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-line p-3">
                <div>
                  <label className={labelClass}>Bước {i + 1} — Tiêu đề</label>
                  <input name={`step${i}_title`} required defaultValue={s.title} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mô tả</label>
                  <textarea
                    name={`step${i}_desc`}
                    required
                    rows={2}
                    defaultValue={s.desc}
                    className={inputClass}
                  />
                </div>
                <details>
                  <summary className="cursor-pointer text-[11px] font-semibold text-ink-soft">
                    🇬🇧 Bản tiếng Anh (tuỳ chọn)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <input
                      name={`step${i}_title_en`}
                      defaultValue={stepsEn[i]?.title ?? ""}
                      placeholder="Title (English)"
                      className={inputClass}
                    />
                    <textarea
                      name={`step${i}_desc_en`}
                      rows={2}
                      defaultValue={stepsEn[i]?.desc ?? ""}
                      placeholder="Description (English)"
                      className={inputClass}
                    />
                  </div>
                </details>
              </div>
            ))}
          </FormSection>

          <FormSection title="CTA band (cuối trang)">
            <div>
              <label className={labelClass}>Tiêu đề</label>
              <input name="ctaTitle" required defaultValue={content.ctaTitle} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Mô tả</label>
              <textarea
                name="ctaDescription"
                required
                rows={2}
                defaultValue={content.ctaDescription}
                className={inputClass}
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <input
                  name="ctaTitleEn"
                  defaultValue={row.ctaTitleEn ?? ""}
                  placeholder="Title (English)"
                  className={inputClass}
                />
                <textarea
                  name="ctaDescriptionEn"
                  rows={2}
                  defaultValue={row.ctaDescriptionEn ?? ""}
                  placeholder="Description (English)"
                  className={inputClass}
                />
              </div>
            </details>
          </FormSection>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
          >
            Lưu nội dung Trang chủ
          </button>
        </form>
      </div>
    </div>
  );
}
