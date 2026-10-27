import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { MoreLink } from "@/components/ui/MoreLink";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { FacultyPortrait } from "@/components/site/FacultyPortrait";
import { Reveal } from "@/components/site/Reveal";
import { getFacultyBySlug, getFacultyList, facultyDisplayName } from "@/lib/data/faculty";
import { getDepartments } from "@/lib/data/departments";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const faculty = await getFacultyBySlug(slug);
  return {
    title: faculty ? facultyDisplayName(faculty) : "Giảng viên",
    description: faculty ? `${facultyDisplayName(faculty)} — ${faculty.role}, Trường Cao đẳng Y Dược Hợp Lực.` : undefined,
  };
}

/** 1 dòng thông tin trong khối "Trình độ & chuyên môn". */
function Fact({ label, children, icon }: { label: string; children: ReactNode; icon: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</div>
      <div className="min-w-0">
        <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">{label}</dt>
        <dd className="mt-1 text-[15px] font-semibold leading-snug text-ink">{children}</dd>
      </div>
    </div>
  );
}

const ICON = {
  role: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" strokeLinecap="round" />
    </svg>
  ),
  degree: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 9l10-5 10 5-10 5L2 9z" strokeLinejoin="round" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" strokeLinecap="round" />
    </svg>
  ),
  department: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 21V8l8-5 8 5v13" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6M4 21h16" strokeLinecap="round" />
    </svg>
  ),
  specialty: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * Hồ sơ 1 giảng viên — phong cách "thanh lịch nền xanh đậm" (đổi 23/10/2026). Thay PageHero bằng khối đầu
 * trang RIÊNG: chân dung khung vòm của chính người đó + tên, chức vụ, khoa trên nền xanh đậm (không dùng ảnh
 * banner chung). Khối này vẫn giữ hợp đồng header (kéo -mt-[72px] lg:-mt-[84px], chừa padding trên) như PageHero.
 * Chưa có tiểu sử → câu giới thiệu dựng từ chức vụ/khoa + ghi chú nhỏ, trang không trông bỏ dở.
 */
export default async function FacultyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [faculty, departments, everyone] = await Promise.all([getFacultyBySlug(slug), getDepartments(), getFacultyList()]);
  if (!faculty) notFound();

  const department = departments.find((d) => d.id === faculty.departmentId);
  const displayName = facultyDisplayName(faculty);
  const titlePrefix = [faculty.academicRank, faculty.degree].filter(Boolean).join(" ");
  const others = everyone.filter((f) => f.id !== faculty.id && f.slug);
  const sameDepartment = department ? others.filter((f) => f.departmentId === department.id) : [];
  const related = (sameDepartment.length > 0 ? sameDepartment : others).slice(0, 4);
  const relatedTitle = sameDepartment.length > 0 ? `Cùng ${department!.name}` : "Đội ngũ nhà trường";

  return (
    <>
      <section className="relative isolate -mt-[72px] overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-800 text-white lg:-mt-[84px]">
        <div className="bg-grid-dark pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-32 -top-20 h-[440px] w-[440px] rounded-full bg-brand-500/30 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 right-[-6rem] h-[420px] w-[420px] rounded-full bg-accent-500/20 blur-[100px]" />
        <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />

        <div className="relative mx-auto grid max-w-[1200px] gap-10 px-6 pt-[112px] sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:gap-16 lg:pt-[150px]">
          <div className="order-2 pb-14 lg:order-1 lg:pb-24">
            <nav aria-label="Breadcrumb" className="hero-rise">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/65">
                <li>
                  <Link href="/" className="transition-colors hover:text-white">
                    Trang chủ
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-accent-400">›</span>
                  <Link href="/doi-ngu-giang-vien" className="transition-colors hover:text-white">
                    Đội ngũ giảng viên
                  </Link>
                </li>
                <li className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="text-accent-400">›</span>
                  <span aria-current="page" className="max-w-[60vw] truncate text-white sm:max-w-md">
                    {faculty.name}
                  </span>
                </li>
              </ol>
            </nav>
            <div className="hero-rise mt-7" style={{ animationDelay: "80ms" }}>
              <Eyebrow tone="onDark">{department ? department.name : "Đội ngũ giảng viên"}</Eyebrow>
            </div>
            {titlePrefix && (
              <div className="hero-rise mt-6 font-mono text-[13px] uppercase tracking-[0.2em] text-brand-200" style={{ animationDelay: "120ms" }}>
                {titlePrefix}
              </div>
            )}
            <h1
              className={cn("hero-rise text-balance font-display text-[38px] font-bold leading-[1.08] tracking-tight sm:text-[52px] lg:text-[58px]", titlePrefix ? "mt-2" : "mt-5")}
              style={{ animationDelay: "160ms" }}
            >
              {faculty.name}
            </h1>
            <div className="hero-rise mt-5 flex items-center gap-3" style={{ animationDelay: "220ms" }}>
              <span className="h-0.5 w-10 rounded-full bg-accent-500" />
              <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent-400">{faculty.role}</span>
            </div>
            {faculty.specialty && (
              <p className="hero-rise mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/75" style={{ animationDelay: "280ms" }}>
                Chuyên môn: {faculty.specialty}
              </p>
            )}
          </div>

          {/* Chân dung: đáy khung chạm mép dưới khối đầu trang (như ảnh đứng trên bục). */}
          <div className="hero-rise relative order-1 mx-auto w-[min(300px,78vw)] lg:order-2 lg:w-full" style={{ animationDelay: "120ms" }}>
            <div
              aria-hidden="true"
              className="absolute inset-0 -translate-y-4 translate-x-4 rounded-t-[999px] border border-white/15 sm:-translate-y-6 sm:translate-x-6"
            />
            <FacultyPortrait
              photoUrl={faculty.photoUrl}
              name={displayName}
              sizes="(max-width: 1024px) 78vw, 380px"
              priority
              className="aspect-[4/5] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65)] ring-1 ring-white/25"
              initialClassName="text-[120px]"
            />
          </div>
        </div>
        {/* Vạch nhấn đỏ ở mép dưới, giống PageHero */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-[min(38%,420px)] bg-gradient-to-r from-accent-600 to-accent-500" />
      </section>

      <DecorativeSection contentClassName="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="gioi-thieu">
            <h2 id="gioi-thieu" className="mb-5 flex items-center gap-3 font-display text-[22px] font-semibold text-brand-900">
              <span className="h-6 w-1 rounded-full bg-accent-600" />
              Giới thiệu
            </h2>
            {faculty.bio ? (
              <MarkdownContent content={faculty.bio} />
            ) : (
              <div className="rounded-2xl border border-line bg-white p-6 shadow-sm2">
                <p className="text-[16px] leading-relaxed text-ink-soft">
                  <strong className="font-semibold text-ink">{displayName}</strong> hiện đảm nhiệm vị trí{" "}
                  {faculty.role.toLocaleLowerCase("vi-VN")}
                  {department ? `, thuộc ${department.name}` : ""} — Trường Cao đẳng Y Dược Hợp Lực.
                </p>
                <p className="mt-3 text-[13px] text-ink-faint">Hồ sơ chi tiết đang được nhà trường cập nhật.</p>
              </div>
            )}
          </section>

          <section aria-labelledby="trinh-do">
            <h2 id="trinh-do" className="mb-5 flex items-center gap-3 font-display text-[22px] font-semibold text-brand-900">
              <span className="h-6 w-1 rounded-full bg-accent-600" />
              Trình độ &amp; chuyên môn
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Chức vụ" icon={ICON.role}>
                {faculty.role}
              </Fact>
              {department && (
                <Fact label="Khoa / Bộ môn" icon={ICON.department}>
                  {department.name}
                </Fact>
              )}
              {faculty.academicRank && (
                <Fact label="Học hàm" icon={ICON.degree}>
                  {faculty.academicRank}
                </Fact>
              )}
              {faculty.degree && (
                <Fact label="Học vị" icon={ICON.degree}>
                  {faculty.degree}
                </Fact>
              )}
              {faculty.specialty && (
                <Fact label="Chuyên môn" icon={ICON.specialty}>
                  {faculty.specialty}
                </Fact>
              )}
            </dl>
          </section>
        </div>

        {related.length > 0 && (
          <aside aria-labelledby="cung-khoa" className="h-fit lg:sticky lg:top-32">
            <div className="overflow-clip rounded-[22px] bg-gradient-to-b from-brand-800 to-brand-900 p-6 text-white shadow-[0_24px_50px_-26px_rgba(6,50,90,0.75)]">
              <h2 id="cung-khoa" className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-200">
                {relatedTitle}
              </h2>
              <ul className="mt-4 divide-y divide-white/10">
                {related.map((f) => (
                  <li key={f.id}>
                    <Link href={`/doi-ngu-giang-vien/${f.slug}`} className="group flex items-center gap-4 py-3.5">
                      <FacultyPortrait
                        photoUrl={f.photoUrl}
                        name={facultyDisplayName(f)}
                        sizes="56px"
                        className="h-14 w-14 shrink-0 rounded-b-[999px] ring-1 ring-white/20"
                        initialClassName="text-[22px]"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-white transition-colors group-hover:text-brand-200">
                          {facultyDisplayName(f)}
                        </span>
                        <span className="block truncate text-[12.5px] text-white/60">{f.role}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Reveal className="mt-5 border-t border-white/10 pt-5">
                <MoreLink href="/doi-ngu-giang-vien" onDark>
                  Xem toàn bộ đội ngũ
                </MoreLink>
              </Reveal>
            </div>
          </aside>
        )}
      </DecorativeSection>
    </>
  );
}
