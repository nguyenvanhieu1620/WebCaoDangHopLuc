"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { cn } from "@/lib/utils";
import type { HeroBanner } from "@/lib/db/schema";

type HeroImageCarouselProps = {
  banners: HeroBanner[];
  fallbackImageUrl: string | null;
  fallbackAlt: string;
};

/**
 * Ảnh Hero Trang chủ — nhiều banner thì tự xoay vòng (chuyển thẳng, chưa có
 * hiệu ứng mượt — làm sau ở đợt hiệu ứng). Không có banner nào thì dùng lại
 * `fallbackImageUrl` (ảnh Hero tĩnh cũ trong Nội dung Trang chủ) để không vỡ
 * layout cho site đã có sẵn dữ liệu trước khi tính năng này ra đời.
 */
export function HeroImageCarousel({ banners, fallbackImageUrl, fallbackAlt }: HeroImageCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) {
    return fallbackImageUrl ? (
      <Image src={fallbackImageUrl} alt={fallbackAlt} fill className="object-cover" />
    ) : (
      <ImagePlaceholder label={fallbackAlt} />
    );
  }

  const banner = banners[index];
  const image = (
    <Image
      src={banner.imageUrl}
      alt={banner.caption || fallbackAlt}
      fill
      className="object-cover"
      priority={index === 0}
    />
  );

  return (
    <>
      {banner.linkUrl ? <Link href={banner.linkUrl}>{image}</Link> : image}

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}
