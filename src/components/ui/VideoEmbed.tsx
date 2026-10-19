import type { VideoSource } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Khung phát video 16:9 dùng chung: YouTube nhúng qua youtube-nocookie.com (CSP `frame-src` đã mở riêng
 * domain này, không đặt cookie theo dõi khi chưa bấm phát), file MP4/WEBM đã tải lên dùng `<video controls>`
 * (tải dần theo `Range`, không tải hết trước). `autoPlay` chỉ dùng khi người xem vừa bấm mở (lightbox).
 */
export function VideoEmbed({
  source,
  title,
  autoPlay,
  className,
}: {
  source: VideoSource;
  title: string;
  autoPlay?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md2", className)}>
      {source.kind === "youtube" ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${source.id}?rel=0${autoPlay ? "&autoplay=1" : ""}`}
          title={title}
          loading={autoPlay ? undefined : "lazy"}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <video
          src={source.src}
          title={title}
          controls
          playsInline
          autoPlay={autoPlay}
          preload="metadata"
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
