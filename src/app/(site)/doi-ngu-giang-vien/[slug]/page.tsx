import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
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
    <DecorativeSection contentClassName="mx-auto max-w-3xl">
        <Link
          href="/doi-ngu-giang-vien"
          className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          ← Đội ngũ giảng viên
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative h-[180px] w-[180px] shrink-0 overflow-hidden rounded-2xl border border-line">
            {faculty.photoUrl ? (
              <Image src={faculty.photoUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <ImagePlaceholder label="Ảnh chân dung" />
            )}
          </div>
          <div>
            <Eyebrow tone="blue" className="mb-3">
              {department ? department.name : "Đội ngũ giảng viên"}
            </Eyebrow>
            <h1 className="font-display text-[28px] font-semibold leading-tight text-brand-900">
              {displayName}
            </h1>
            <div className="mt-1.5 text-[15px] font-semibold text-brand-700">{faculty.role}</div>
            {faculty.specialty && (
              <div className="mt-3 text-[14px] text-ink-soft">
                <span className="font-semibold text-ink">Chuyên môn: </span>
                {faculty.specialty}
              </div>
            )}
          </div>
        </div>

        {faculty.bio && <MarkdownContent content={faculty.bio} className="mt-10" />}
    </DecorativeSection>
  );
}
