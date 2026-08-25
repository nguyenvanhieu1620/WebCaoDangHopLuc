import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * 404 cho các trang trong nhóm "(site)" — tự động có header/footer vì nằm
 * trong route group này. Next.js dùng file này khi `notFound()` được gọi ở
 * bất kỳ trang con nào (bài viết/ngành/giảng viên/trang Công khai không tồn
 * tại) hoặc khi URL không khớp route nào bên trong "(site)".
 */
export default function SiteNotFound() {
  return (
    <section className="relative overflow-hidden px-8 py-32">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="mx-auto max-w-lg text-center">
        <Eyebrow tone="red" className="mb-6">
          404
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          Không tìm thấy trang này
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-ink-soft">
          Trang bạn tìm có thể đã bị xoá, đổi địa chỉ, hoặc đường dẫn đã nhập
          không đúng.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href="/">Về trang chủ</Button>
          <Button href="/lien-he" variant="outline">
            Liên hệ nhà trường
          </Button>
        </div>
      </div>
    </section>
  );
}
