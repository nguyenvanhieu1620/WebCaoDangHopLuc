import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * 404 cho các trang trong nhóm "(site)" — tự động có header/footer vì nằm
 * trong route group này. Next.js dùng file này khi `notFound()` được gọi ở
 * bất kỳ trang con nào (bài viết/ngành/giảng viên/trang Công khai không tồn
 * tại) hoặc khi URL không khớp route nào bên trong "(site)". Mở đầu bằng
 * PageHero như mọi trang con (header chữ trắng trong suốt cần nền tối).
 */
export default function SiteNotFound() {
  return (
    <>
      <PageHero bannerKey="khong-tim-thay"
        crumbs={[{ label: "404" }]}
        eyebrow="Lỗi 404"
        title="Không tìm thấy trang này"
        description="Trang bạn tìm có thể đã bị xoá, đổi địa chỉ, hoặc đường dẫn đã nhập không đúng."
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/">Về trang chủ</Button>
          <Button href="/lien-he" variant="ghostLight">
            Liên hệ nhà trường
          </Button>
        </div>
      </PageHero>
      <div className="h-16" />
    </>
  );
}
