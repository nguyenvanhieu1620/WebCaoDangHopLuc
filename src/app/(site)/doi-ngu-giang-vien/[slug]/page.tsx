import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getFacultyBySlug, facultyDisplayName } from "@/lib/data/faculty";
import { getDepartments } from "@/lib/data/departments";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const faculty = await getFacultyBySlug(slug);
  return { title: faculty ? facultyDisplayName(faculty) : "Giảng viên" };
}

export default async function FacultyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [faculty, departments] = await Promise.all([getFacultyBySlug(slug), getDepartments()]);
  if (!faculty) notFound();

  const department = departments.find((d) => d.id === faculty.departmentId);
  const displayName = facultyDisplayName(faculty);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Đội ngũ giảng viên", href: "/doi-ngu-giang-vien" }, { label: displayName }]}
        eyebrow={department ? department.name : "Đội ngũ giảng viên"}
        title={displayName}
        description={faculty.role}
        variant="article"
      />
      <DecorativeSection contentClassName="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[280px_1fr] md:gap-14">
        {/* Ảnh chân dung khung vòm (kiểu khối lãnh đạo VinUni) + thông tin nhanh */}
        <div>
          <div className="relative mx-auto h-[340px] w-[260px] overflow-hidden rounded-t-full border-4 border-white bg-gradient-to-br from-brand-500 to-brand-800 shadow-[0_30px_60px_-20px_rgba(6,50,90,0.55)] md:mx-0 md:w-full">
            {faculty.photoUrl ? (
              <Image src={faculty.photoUrl} alt={displayName} fill sizes="280px" className="object-cover object-top" />
            ) : (
              <ImagePlaceholder label="Ảnh chân dung" />
            )}
          </div>
          <dl className="mt-6 space-y-3 rounded-2xl border border-line bg-white p-5 text-[14px] shadow-sm2">
            <div>
              <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">Chức vụ</dt>
              <dd className="mt-0.5 font-semibold text-ink">{faculty.role}</dd>
            </div>
            {department && (
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">Khoa / Bộ môn</dt>
                <dd className="mt-0.5 font-semibold text-ink">{department.name}</dd>
              </div>
            )}
            {faculty.specialty && (
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">Chuyên môn</dt>
                <dd className="mt-0.5 font-semibold text-ink">{faculty.specialty}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="min-w-0">
          {faculty.bio ? (
            <MarkdownContent content={faculty.bio} />
          ) : (
            <p className="text-[15px] text-ink-faint">Thông tin chi tiết về giảng viên đang được cập nhật.</p>
          )}
        </div>
      </DecorativeSection>
    </>
  );
}
