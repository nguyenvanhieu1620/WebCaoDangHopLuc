import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import { programGradient } from "@/lib/constants";
import { getPrograms } from "@/lib/data/programs";

export const metadata: Metadata = { title: "Ngành đào tạo" };

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-[1220px]">
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
              <Link
                key={p.slug}
                href={`/nganh-dao-tao/${p.slug}`}
                className={cn(
                  "group relative overflow-hidden rounded-[22px] bg-gradient-to-br p-7 text-white shadow-md2 transition-transform hover:-translate-y-1.5",
                  programGradient(i)
                )}
              >
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-[150px] w-[150px] rounded-full bg-white/10" />
                <div className="relative flex items-center justify-between font-mono text-[10.5px] uppercase tracking-wider text-white/85">
                  <span>{p.code}</span>
                  <span>{p.duration}</span>
                </div>
                <h3 className="relative mt-3.5 font-display text-[22px] font-bold">{p.name}</h3>
                <p className="relative mt-2.5 text-[13px] leading-relaxed text-white/90">
                  {p.summary}
                </p>
                <div className="relative mt-5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/80">
                    Chỉ tiêu {p.intake}
                  </span>
                  <span className="text-[13px] font-bold">Chi tiết →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
