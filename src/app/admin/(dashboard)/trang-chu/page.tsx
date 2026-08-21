import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getHomepageContent } from "@/lib/data/homepage";
import { updateHomepageContentAction } from "./actions";

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
  const content = await getHomepageContent();

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
              {content.heroImageUrl && (
                <Image
                  src={content.heroImageUrl}
                  alt="Ảnh Hero hiện tại"
                  width={220}
                  height={128}
                  className="mb-2 h-32 w-auto rounded-lg border border-line object-cover"
                />
              )}
              <input
                type="file"
                name="heroImage"
                accept="image/*"
                className="w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
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
          </FormSection>

          <FormSection title="4 chỉ số thống kê">
            {content.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr] gap-3">
                <div>
                  <label className={labelClass}>Số liệu</label>
                  <input name={`stat${i}_value`} required defaultValue={s.value} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nhãn</label>
                  <input name={`stat${i}_label`} required defaultValue={s.label} className={inputClass} />
                </div>
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
