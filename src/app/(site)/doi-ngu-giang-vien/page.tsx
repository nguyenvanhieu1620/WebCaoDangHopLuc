import { pageText } from "@/lib/page-copy";
import type { Metadata } from "next";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { FacultyDirectory } from "@/components/site/FacultyDirectory";
import { getFacultyList, facultyDisplayName } from "@/lib/data/faculty";
import { getDepartments } from "@/lib/data/departments";
import { buildFacultyDirectory, type DirectoryFilters } from "@/lib/faculty-directory";
import { getLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const copy = pageText(await getLocale());
  return { title: copy("Đội ngũ giảng viên") };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Lấy 1 tham số chuỗi (tối đa 100 ký tự) — URL có thể bị sửa tay hoặc lặp tham số. */
const param = (sp: Record<string, string | string[] | undefined>, key: string) => {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v ?? "").slice(0, 100);
};

export default async function FacultyPage({ searchParams }: { searchParams: SearchParams }) {
  const copy = pageText(await getLocale());
  const [facultyList, departments, sp, locale] = await Promise.all([getFacultyList(), getDepartments(), searchParams, getLocale()]);
  const directory = buildFacultyDirectory(facultyList, departments, facultyDisplayName, locale);
  // Bộ lọc ban đầu từ URL (`?q=&khoa=&trinh-do=&hoc-ham=&chuc-vu=`) — client tự ghi lại khi người xem đổi lọc.
  const initial: DirectoryFilters = {
    q: param(sp, "q"),
    khoa: param(sp, "khoa"),
    trinhDo: param(sp, "trinh-do"),
    hocHam: param(sp, "hoc-ham"),
    chucVu: param(sp, "chuc-vu"),
  };

  return (
    <>
      <PageHero
        bannerKey="doi-ngu-giang-vien"
        crumbs={[{ label: copy("Đội ngũ giảng viên") }]}
        eyebrow={copy("Đội ngũ giảng viên")}
        title={copy("Đội ngũ giảng viên giàu kinh nghiệm lâm sàng")}
        description={copy("Toàn bộ đội ngũ giảng viên, bác sĩ, dược sĩ thỉnh giảng đang trực tiếp giảng dạy tại trường.")}
      />
      <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        {facultyList.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            {copy("Chưa có thông tin giảng viên — quản lý qua admin/giang-vien.")}
          </div>
        ) : (
          <FacultyDirectory {...directory} locale={locale} initial={initial} />
        )}
      </DecorativeSection>
    </>
  );
}
