import { pageText } from "@/lib/page-copy";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/site/PageHero";

export async function generateMetadata(): Promise<Metadata> {
  const copy = pageText(await getLocale());
  return { title: copy("Không tìm thấy trang") };
}

/**
 * 404 cho các trang trong nhóm "(site)" — tự động có header/footer vì nằm
 * trong route group này. Next.js dùng file này khi `notFound()` được gọi ở
 * bất kỳ trang con nào (bài viết/ngành/giảng viên/trang Công khai không tồn
 * tại) hoặc khi URL không khớp route nào bên trong "(site)". Mở đầu bằng
 * PageHero như mọi trang con (header chữ trắng trong suốt cần nền tối).
 */
export default async function SiteNotFound() {
  const copy = pageText(await getLocale());
  return (
    <>
      <PageHero bannerKey="khong-tim-thay"
        crumbs={[{ label: "404" }]}
        eyebrow={copy("Lỗi 404")}
        title={copy("Không tìm thấy trang này")}
        description={copy("Trang bạn tìm có thể đã bị xoá, đổi địa chỉ, hoặc đường dẫn đã nhập không đúng.")}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/">{copy("Về trang chủ")}</Button>
          <Button href="/lien-he" variant="ghostLight">
            {copy("Liên hệ nhà trường")}
          </Button>
        </div>
      </PageHero>
      <div className="h-16" />
    </>
  );
}
