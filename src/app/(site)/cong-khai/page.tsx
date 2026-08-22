import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getPagesBySlugPrefix } from "@/lib/data/pages";

export const metadata: Metadata = { title: "Công khai" };

/**
 * Mục lục các trang "3 công khai" theo quy định Bộ GD&ĐT (Thông tư 36/2017)
 * cho cơ sở giáo dục nghề nghiệp — nội dung từng trang quản lý qua admin/trang-tinh.
 */
export default async function CongKhaiPage() {
  const pages = await getPagesBySlugPrefix("cong-khai-");

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Eyebrow tone="blue" className="mb-6">
          Công khai
        </Eyebrow>
        <h1 className="font-display text-[34px] font-semibold leading-tight text-brand-900">
          Thông tin công khai theo quy định
        </h1>
        <p className="mt-3.5 max-w-xl text-[15.5px] leading-relaxed text-ink-soft">
          Nhà trường công khai các nội dung theo đúng quy định về đào tạo, cơ
          sở vật chất, đội ngũ giảng viên và tài chính.
        </p>

        {pages.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-sm text-ink-faint">
            Chưa có nội dung công khai nào được đăng.
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-line rounded-2xl border border-line bg-white">
            {pages.map((page) => (
              <li key={page.id}>
                <Link
                  href={`/cong-khai/${page.slug}`}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-paper-alt"
                >
                  <span className="font-display text-base font-semibold text-ink">
                    {page.title}
                  </span>
                  <span className="text-sm font-semibold text-brand-700">Xem →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
