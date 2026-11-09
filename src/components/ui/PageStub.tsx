import { pageText } from "@/lib/page-copy";
import { getLocale } from "@/lib/locale";
import { PageHero } from "@/components/site/PageHero";

type PageStubProps = {
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Khung tạm cho các trang chưa có nội dung (VD admin lỡ xoá trang tĩnh tương
 * ứng). Vẫn mở đầu bằng `PageHero` như mọi trang con — header chữ trắng trong
 * suốt cần khối nền tối phía dưới.
 */
export async function PageStub({ eyebrow, title, description }: PageStubProps) {
  const copy = pageText(await getLocale());
  return (
    <>
      <PageHero crumbs={[{ label: eyebrow }]} eyebrow={eyebrow} title={title} description={description} />
      <section className="px-6 py-20 sm:px-8">
        <div className="mx-auto w-fit rounded-2xl border border-line bg-white px-6 py-4 text-center font-mono text-xs uppercase tracking-wider text-ink-faint shadow-sm2">
          {copy("Trang đang được xây dựng — nội dung chi tiết sẽ hoàn thiện ở bước tiếp theo")}
        </div>
      </section>
    </>
  );
}
