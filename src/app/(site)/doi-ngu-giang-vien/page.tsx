import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { TiltCard } from "@/components/site/TiltCard";
import { Reveal } from "@/components/site/Reveal";
import { getFacultyList, facultyDisplayName } from "@/lib/data/faculty";
import { getDepartments } from "@/lib/data/departments";
import type { Faculty } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

function FacultyCard({ faculty, index }: { faculty: Faculty; index: number }) {
  const displayName = facultyDisplayName(faculty);
  const card = (
    <>
      <div className="img-reveal img-shine relative h-[240px]">
        {faculty.photoUrl ? (
          <Image
            src={faculty.photoUrl}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder label="Ảnh chân dung" />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-display text-base font-semibold text-ink transition-colors group-hover:text-brand-700">{displayName}</h4>
        <div className="mt-0.5 text-[12.5px] text-brand-700">{faculty.role}</div>
      </div>
    </>
  );
  const className =
    "group block overflow-clip rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2";
  return (
    <Reveal delay={(index % 4) * 80}>
      <TiltCard className="rounded-2xl">
        {faculty.slug ? (
          <Link href={`/doi-ngu-giang-vien/${faculty.slug}`} className={className}>
            {card}
          </Link>
        ) : (
          <div className={className}>{card}</div>
        )}
      </TiltCard>
    </Reveal>
  );
}

export default async function FacultyPage() {
  const [facultyList, departments] = await Promise.all([getFacultyList(), getDepartments()]);

  const byDepartment = departments
    .map((d) => ({ department: d, members: facultyList.filter((f) => f.departmentId === d.id) }))
    .filter((g) => g.members.length > 0);
  const noDepartment = facultyList.filter(
    (f) => !f.departmentId || !departments.some((d) => d.id === f.departmentId)
  );

  return (
    <>
    <PageHero bannerKey="doi-ngu-giang-vien"
      crumbs={[{ label: "Đội ngũ giảng viên" }]}
      eyebrow="Đội ngũ giảng viên"
      title="Đội ngũ giảng viên giàu kinh nghiệm lâm sàng"
      description="Toàn bộ đội ngũ giảng viên, bác sĩ, dược sĩ thỉnh giảng đang trực tiếp giảng dạy tại trường."
    />
    <DecorativeSection contentClassName="mx-auto max-w-[1220px]">

        {facultyList.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có thông tin giảng viên — quản lý qua admin/giang-vien.
          </div>
        ) : (
          <div className="space-y-14">
            {byDepartment.map(({ department, members }) => (
              <div key={department.id}>
                <div className="mb-6 flex items-center gap-4">
                  <span className="h-6 w-1 rounded-full bg-accent-600" />
                  <h2 className="font-display text-[22px] font-semibold text-brand-900">{department.name}</h2>
                  <span className="font-mono text-[11px] text-ink-faint">{members.length} giảng viên</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {members.map((f, i) => (
                    <FacultyCard key={f.id} faculty={f} index={i} />
                  ))}
                </div>
              </div>
            ))}

            {noDepartment.length > 0 && (
              <div>
                {byDepartment.length > 0 && (
                  <div className="mb-5 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                    Khác
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {noDepartment.map((f, i) => (
                    <FacultyCard key={f.id} faculty={f} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </DecorativeSection>
    </>
  );
}
