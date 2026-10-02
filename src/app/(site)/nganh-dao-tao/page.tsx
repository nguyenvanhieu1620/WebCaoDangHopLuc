import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { ProgramExplorer } from "@/components/site/ProgramExplorer";
import { getLocale } from "@/lib/locale";
import { getPrograms } from "@/lib/data/programs";

export const metadata: Metadata = { title: "Ngành đào tạo" };

export default async function ProgramsPage() {
  const programs = await getPrograms();
  const locale = await getLocale();

  return (
    <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        <div className="mb-10 max-w-2xl">
          <Eyebrow tone="blue">{locale === "en" ? "Study programs" : "Ngành đào tạo"}</Eyebrow>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-brand-900 sm:text-4xl">{locale === "en" ? `${programs.length} pathways into healthcare` : `${programs.length} ngành khối sức khỏe giàu cơ hội`}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{locale === "en" ? "Explore programs, compare duration and intake, and find the right path for you." : "Khám phá ngành, so sánh thời gian học và chỉ tiêu để chọn hướng đi phù hợp với bạn."}</p>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có ngành đào tạo nào — quản lý qua admin/nganh-dao-tao.
          </div>
        ) : (
          <ProgramExplorer programs={programs.map(({ slug, name, summary, duration, intake }) => ({ slug, name, summary, duration, intake }))} locale={locale} />
        )}
    </DecorativeSection>
  );
}
