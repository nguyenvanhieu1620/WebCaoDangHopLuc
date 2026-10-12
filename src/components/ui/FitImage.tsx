import Image from "next/image";
import { cn } from "@/lib/utils";

type FitImageProps = {
  src: string;
  alt: string;
  sizes: string;
  /** Class thêm cho ảnh chính (VD hiệu ứng hover). KHÔNG truyền `object-*` — component tự quản. */
  className?: string;
  /** Neo ảnh lên trên khi phủ kín khung ở màn hình ≥ md (VD chân dung giảng viên). */
  anchorTop?: boolean;
  /** Thẻ có chữ đè ở nửa dưới (tin nổi bật): trên điện thoại đặt ảnh sát mép trên để chữ nằm trên nền mờ, không che ảnh. */
  textBelow?: boolean;
  priority?: boolean;
  /** `false` trong slider kéo bằng chuột (không cho kéo ảnh ra ngoài). */
  draggable?: boolean;
};

/**
 * Ảnh trong thẻ (khung cố định, cha phải `relative` + có kích thước) — CHỈ TẢI 1 ẢNH mà
 * điện thoại không bị mất phần nào:
 * - Màn hình < md (điện thoại): ảnh thu vừa khung, hiện TRỌN VẸN (object-contain); phần khung
 *   còn thừa lấp bằng chính ảnh đó phóng to + làm mờ → thẻ vẫn cao đều, không lộ viền trống.
 * - ≥ md: phủ kín khung như cũ (object-cover), lớp mờ ẩn đi.
 * Hai thẻ <img> cùng `src` + `sizes` → trình duyệt chỉ tải 1 lần.
 */
export function FitImage({ src, alt, sizes, className, anchorTop, textBelow, priority, draggable }: FitImageProps) {
  return (
    <>
      <Image src={src} alt="" aria-hidden fill sizes={sizes} draggable={draggable} className="scale-125 object-cover opacity-70 blur-xl md:hidden" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        draggable={draggable}
        className={cn("object-contain md:object-cover", anchorTop && "md:object-top", textBelow && "object-top md:object-center", className)}
      />
    </>
  );
}
