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
 * Ảnh Hero Trang chủ — nhiều banner thì tự xoay vòng, chuyển ảnh mượt kiểu
 * crossfade (mọi banner luôn nằm trong DOM, chỉ đổi opacity — không unmount/
 * remount <Image> nên không giật/tải lại ảnh). Không có banner nào thì dùng
 * lại `fallbackImageUrl` (ảnh Hero tĩnh cũ trong Nội dung Trang chủ) để
 * không vỡ layout cho site đã có sẵn dữ liệu trước khi tính năng này ra đời.
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

  const goPrev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);
  const goNext = () => setIndex((i) => (i + 1) % banners.length);

  if (banners.length === 0) {
    return fallbackImageUrl ? (
      <Image src={fallbackImageUrl} alt={fallbackAlt} fill className="object-cover" />
    ) : (
      <ImagePlaceholder label={fallbackAlt} />
    );
  }

  return (
    <>
      {banners.map((banner, i) => {
        const image = (
          <Image
            src={banner.imageUrl}
            alt={banner.caption || fallbackAlt}
            fill
            className="object-cover"
            priority={i === 0}
          />
        );
        return (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {banner.linkUrl ? (
              <Link href={banner.linkUrl} className="block h-full w-full">
                {image}
              </Link>
            ) : (
              image
            )}
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Ảnh tiếp theo"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
