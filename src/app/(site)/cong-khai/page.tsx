import type { Metadata } from "next";
import Link from "next/link";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getPagesBySlugPrefix } from "@/lib/data/pages";

export const metadata: Metadata = { title: "Công khai" };

/**
 * Mục lục các trang "3 công khai" theo quy định Bộ GD&ĐT (Thông tư 36/2017)
 * cho cơ sở giáo dục nghề nghiệp — nội dung từng trang quản lý qua admin/trang-tinh.
 */
export default async function CongKhaiPage() {
  const pages = await getPagesBySlugPrefix("cong-khai-");

  return (
    <>
      <PageHero
        crumbs={[{ label: "Công khai" }]}
        eyebrow="Công khai"
        title="Thông tin công khai theo quy định"
        description="Nhà trường công khai các nội dung theo đúng quy định về đào tạo, cơ sở vật chất, đội ngũ giảng viên và tài chính."
      />
      <DecorativeSection contentClassName="mx-auto max-w-3xl">
        {pages.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-sm text-ink-faint">
            Chưa có nội dung công khai nào được đăng.
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm2">
            {pages.map((page, i) => (
              <li key={page.id}>
                <Link
                  href={`/cong-khai/${page.slug}`}
                  className="group flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-paper-alt"
                >
                  <span className="flex items-center gap-4">
                    <span className="font-mono text-[11px] text-accent-600">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-base font-semibold text-ink group-hover:text-brand-700">{page.title}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand-700">
                    <span className="link-underline">Xem</span> →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DecorativeSection>
    </>
  );
}
