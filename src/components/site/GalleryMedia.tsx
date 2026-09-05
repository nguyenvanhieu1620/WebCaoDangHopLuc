import Image from "next/image";
import type { GalleryItem } from "@/lib/db/schema";

type GalleryMediaProps = {
  item: Pick<GalleryItem, "imageUrl" | "videoUrl" | "caption">;
  className?: string;
};

/**
 * Ảnh 1 ô trong Thư viện — nếu có `videoUrl` thì `imageUrl` đóng vai trò ảnh
 * bìa, phủ icon Play lên trên, bấm mở video (VD YouTube) ở tab mới. Không
 * có `videoUrl` thì chỉ là ảnh tĩnh như trước.
 */
export function GalleryMedia({ item, className }: GalleryMediaProps) {
  const media = (
    <>
      <Image src={item.imageUrl} alt={item.caption} fill className="object-cover" />
      {item.videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-brand-900">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </>
  );

  if (item.videoUrl) {
    return (
      <a
        href={item.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative block ${className ?? ""}`}
        aria-label={`Xem video: ${item.caption}`}
      >
        {media}
      </a>
    );
  }

  return <div className={`relative ${className ?? ""}`}>{media}</div>;
}
