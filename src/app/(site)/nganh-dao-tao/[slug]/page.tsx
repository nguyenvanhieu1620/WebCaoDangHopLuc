import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getProgramBySlug } from "@/lib/data/programs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  return { title: program ? program.name : "Ngành đào tạo" };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const facts = [
    { label: "Thời gian đào tạo", value: program.duration },
    { label: "Chỉ tiêu tuyển sinh", value: String(program.intake) },
    { label: "Học phí", value: program.tuition ?? null },
  ];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Ngành đào tạo", href: "/nganh-dao-tao" }, { label: program.name }]}
        eyebrow={`Mã ngành ${program.code}`}
        title={program.name}
        description={program.summary}
      >
        {/* Thông số chính ngay trên banner — dạng thẻ kính */}
        <dl className="flex flex-wrap gap-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-md">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-white/65">{f.label}</dt>
              <dd className="mt-0.5 text-[16px] font-semibold">{f.value ?? "Liên hệ tư vấn"}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <DecorativeSection contentClassName="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
        <div className="min-w-0">
          {program.content ? (
            <MarkdownContent content={program.content} />
          ) : (
            <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-faint">
              Chương trình đào tạo chi tiết đang được cập nhật — liên hệ hotline
              để được tư vấn thêm về ngành {program.name}.
            </div>
          )}
        </div>

        <aside className="h-fit rounded-[22px] border border-line bg-white p-6 shadow-sm2 lg:sticky lg:top-28">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Xét tuyển ngành</div>
          <div className="mt-2 font-display text-[22px] font-semibold leading-snug text-brand-900">{program.name}</div>
          <dl className="mt-5 divide-y divide-line border-y border-line text-[14px]">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-ink-faint">{f.label}</dt>
                <dd className="text-right font-semibold text-ink">
                  {f.value ?? (
                    <Link href="/lien-he" className="text-brand-700 hover:underline">
                      Liên hệ tư vấn
                    </Link>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-2.5">
            {/* Nhãn ngắn: cột 320px, nhãn dài bị xuống 2 dòng với Montserrat (tiêu đề khung đã ghi "Xét tuyển ngành"). */}
            <Button href={`/tuyen-sinh?nganh=${encodeURIComponent(program.slug)}#dang-ky`} className="w-full justify-center whitespace-nowrap">
              Đăng ký xét tuyển →
            </Button>
            <Button href="/nganh-dao-tao" variant="outline" className="w-full justify-center">
              Xem các ngành khác
            </Button>
          </div>
        </aside>
      </DecorativeSection>
    </>
  );
}
