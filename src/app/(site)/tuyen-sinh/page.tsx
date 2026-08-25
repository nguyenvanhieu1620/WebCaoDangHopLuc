import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AdmissionForm } from "@/components/site/AdmissionForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { getPrograms } from "@/lib/data/programs";

export const metadata: Metadata = { title: "Tuyển sinh" };

export default async function AdmissionsPage() {
  const programs = await getPrograms();

  return (
    <DecorativeSection contentClassName="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Eyebrow tone="red" className="mb-6">
            Tuyển sinh 2026
          </Eyebrow>
          <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
            Chỉ tiêu, điều kiện &amp; đăng ký xét tuyển
          </h1>
          <p className="mt-3.5 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Xét tuyển học bạ THPT — điền form bên cạnh, đội ngũ tư vấn sẽ liên
            hệ trong vòng 24 giờ.
          </p>

          {programs.length > 0 && (
            <div className="mt-9 overflow-hidden rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper-alt text-[11px] uppercase tracking-wider text-ink-faint">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Ngành</th>
                    <th className="px-5 py-3 font-semibold">Thời gian</th>
                    <th className="px-5 py-3 font-semibold">Chỉ tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {programs.map((p) => (
                    <tr key={p.slug}>
                      <td className="px-5 py-3.5 font-medium text-ink">
                        <Link href={`/nganh-dao-tao/${p.slug}`} className="hover:text-brand-700 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft">{p.duration}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{p.intake}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="dang-ky" className="h-fit scroll-mt-6 rounded-2xl border border-line bg-white p-7 shadow-md2">
          <div className="mb-5 font-display text-lg font-semibold text-ink">
            Đăng ký xét tuyển
          </div>
          <AdmissionForm programs={programs} />
        </div>
    </DecorativeSection>
  );
}
