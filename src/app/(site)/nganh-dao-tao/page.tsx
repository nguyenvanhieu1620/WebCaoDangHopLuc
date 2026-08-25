import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { programGradient } from "@/lib/constants";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { ProgramCard } from "@/components/site/ProgramCard";
import { getPrograms } from "@/lib/data/programs";

export const metadata: Metadata = { title: "Ngành đào tạo" };

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        <SectionHeading
          eyebrow="Ngành đào tạo"
          title={`${programs.length} ngành khối sức khỏe giàu cơ hội`}
          description="Danh sách đầy đủ các ngành đào tạo chính quy, chỉ tiêu tuyển sinh và cơ hội nghề nghiệp."
        />

        {programs.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có ngành đào tạo nào — quản lý qua admin/nganh-dao-tao.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p, i) => (
              <ProgramCard key={p.slug} program={p} gradientClass={programGradient(i)} delay={i * 80} />
            ))}
          </div>
        )}
    </DecorativeSection>
  );
}
