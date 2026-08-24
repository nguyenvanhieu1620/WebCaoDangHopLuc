import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { getFacultyList, facultyDisplayName } from "@/lib/data/faculty";
import { getDepartments } from "@/lib/data/departments";
import type { Faculty } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

function FacultyCard({ faculty }: { faculty: Faculty }) {
  const displayName = facultyDisplayName(faculty);
  const card = (
    <>
      <div className="relative h-[220px]">
        {faculty.photoUrl ? (
          <Image src={faculty.photoUrl} alt={displayName} fill className="object-cover" />
        ) : (
          <ImagePlaceholder label="Ảnh chân dung" />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-display text-base font-semibold text-ink">{displayName}</h4>
        <div className="mt-0.5 text-[12.5px] text-brand-700">{faculty.role}</div>
      </div>
    </>
  );
  const className =
    "overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-transform hover:-translate-y-1";
  return faculty.slug ? (
    <Link href={`/doi-ngu-giang-vien/${faculty.slug}`} className={className}>
      {card}
    </Link>
  ) : (
    <div className={className}>{card}</div>
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
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-[1220px]">
        <SectionHeading
          eyebrow="Đội ngũ giảng viên"
          title="Đội ngũ giảng viên giàu kinh nghiệm lâm sàng"
          description="Toàn bộ đội ngũ giảng viên, bác sĩ, dược sĩ thỉnh giảng đang trực tiếp giảng dạy tại trường."
        />

        {facultyList.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có thông tin giảng viên — quản lý qua admin/giang-vien.
          </div>
        ) : (
          <div className="space-y-14">
            {byDepartment.map(({ department, members }) => (
              <div key={department.id}>
                <div className="mb-5 font-mono text-[11px] uppercase tracking-wider text-brand-700">
                  {department.name}
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {members.map((f) => (
                    <FacultyCard key={f.id} faculty={f} />
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
                  {noDepartment.map((f) => (
                    <FacultyCard key={f.id} faculty={f} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
