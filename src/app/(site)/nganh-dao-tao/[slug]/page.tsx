import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
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

  return (
    <DecorativeSection contentClassName="mx-auto max-w-3xl">
        <Link
          href="/nganh-dao-tao"
          className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          ← Ngành đào tạo
        </Link>

        <Eyebrow tone="blue" className="mb-6">
          {program.code}
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          {program.name}
        </h1>
        <p className="mt-3.5 max-w-xl text-[15.5px] leading-relaxed text-ink-soft">
          {program.summary}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white p-6 sm:grid-cols-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
              Thời gian đào tạo
            </div>
            <div className="mt-1 text-lg font-semibold text-ink">{program.duration}</div>
          </div>
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
              Chỉ tiêu tuyển sinh
            </div>
            <div className="mt-1 text-lg font-semibold text-ink">{program.intake}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
              Học phí
            </div>
            <div className="mt-1 text-lg font-semibold text-ink">
              {program.tuition ?? <Link href="/lien-he" className="text-brand-700 hover:underline">Liên hệ tư vấn</Link>}
            </div>
          </div>
        </div>

        {program.content ? (
          <MarkdownContent content={program.content} className="mt-10" />
        ) : (
          <div className="mt-10 rounded-2xl border border-line bg-white p-6 text-sm text-ink-faint">
            Chương trình đào tạo chi tiết đang được cập nhật — liên hệ hotline
            để được tư vấn thêm về ngành {program.name}.
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-8">
          <Button href={`/tuyen-sinh?nganh=${encodeURIComponent(program.slug)}#dang-ky`}>Đăng ký xét tuyển ngành này →</Button>
          <Button href="/nganh-dao-tao" variant="outline">
            Xem các ngành khác
          </Button>
        </div>
    </DecorativeSection>
  );
}
