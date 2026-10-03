import Image from "next/image";
import type { GalleryItem } from "@/lib/db/schema";

type GalleryMediaProps = {
  item: Pick<GalleryItem, "imageUrl" | "videoUrl" | "caption">;
  className?: string;
  sizes?: string;
};

/**
 * Ảnh 1 ô trong Thư viện — nếu có `videoUrl` thì `imageUrl` đóng vai trò ảnh
 * bìa, phủ icon Play lên trên. Chỉ HIỂN THỊ: việc bấm mở (ảnh phóng to / phát
 * video ngay trên trang) do `LightboxTrigger` bọc bên ngoài đảm nhận (xem
 * Lightbox.tsx) — không tự là link/nút để tránh lồng phần tử bấm được.
 */
export function GalleryMedia({ item, className, sizes = "(max-width: 640px) 50vw, 33vw" }: GalleryMediaProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Image src={item.imageUrl} alt={item.caption} fill sizes={sizes} className="object-cover transition-transform duration-700 group-hover:scale-105" />
      {item.videoUrl && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-brand-900" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
