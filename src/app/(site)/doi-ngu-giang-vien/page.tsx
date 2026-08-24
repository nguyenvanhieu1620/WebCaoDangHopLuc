import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { getFacultyList } from "@/lib/data/faculty";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

export default async function FacultyPage() {
  const facultyList = await getFacultyList();

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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {facultyList.map((f) => {
              const card = (
                <>
                  <div className="relative h-[220px]">
                    {f.photoUrl ? (
                      <Image src={f.photoUrl} alt={f.name} fill className="object-cover" />
                    ) : (
                      <ImagePlaceholder label="Ảnh chân dung" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-display text-base font-semibold text-ink">{f.name}</h4>
                    <div className="mt-0.5 text-[12.5px] text-brand-700">{f.role}</div>
                  </div>
                </>
              );
              const className =
                "overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-transform hover:-translate-y-1";
              return f.slug ? (
                <Link key={f.id} href={`/doi-ngu-giang-vien/${f.slug}`} className={className}>
                  {card}
                </Link>
              ) : (
                <div key={f.id} className={className}>
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
