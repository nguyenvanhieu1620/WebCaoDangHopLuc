"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { cn, videoSource } from "@/lib/utils";

export type LightboxItem = {
  id: string;
  imageUrl: string;
  caption: string;
  videoUrl: string | null;
};

const OpenContext = createContext<(index: number) => void>(() => {});

/**
 * Xem ảnh/video NGAY TRÊN TRANG (kiểu Fancybox ở VinUni) cho Thư viện — thay
 * cho mở tab mới. `LightboxGroup` giữ danh sách + trạng thái, các ô ảnh bên
 * trong dùng `LightboxTrigger index={i}` để mở đúng mục. Server Component bọc
 * được cả 2 (chỉ truyền dữ liệu thường).
 *
 * - Dùng `<dialog>` + `showModal()`: Esc đóng, focus nằm trong hộp, phần còn
 *   lại của trang bị khoá tương tác — không phải tự viết focus trap.
 * - Video YouTube phát qua youtube-nocookie.com (CSP `frame-src` đã mở riêng
 *   domain này, xem next.config.js), video MP4/WEBM đã tải lên Thư viện media
 *   phát bằng `<video>`; link video khác (Facebook, Vimeo…) không nhúng được →
 *   hiện ảnh bìa + nút mở tab mới.
 * - ← → / vuốt ngang để chuyển mục; khoá cuộn trang nền khi đang mở.
 */
export function LightboxGroup({ items, children }: { items: LightboxItem[]; children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = useCallback((i: number) => setIndex(i), []);
  return (
    <OpenContext.Provider value={open}>
      {children}
      {index !== null && items[index] && (
        <LightboxDialog items={items} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
      )}
    </OpenContext.Provider>
  );
}

export function LightboxTrigger({
  index,
  label,
  className,
  children,
}: {
  index: number;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(OpenContext);
  return (
    // Không đặt sẵn class bố cục (block/w-full…) — `cn()` không gộp class, nơi dùng tự truyền đủ.
    <button type="button" onClick={() => open(index)} aria-label={label} aria-haspopup="dialog" className={cn("group text-left", className)}>
      {children}
    </button>
  );
}

function LightboxDialog({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: LightboxItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);
  const item = items[index];
  const count = items.length;
  const go = useCallback((step: number) => onIndex((index + step + count) % count), [index, count, onIndex]);
  const video = videoSource(item.videoUrl);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Nhớ phần tử đang focus (ô ảnh vừa bấm) để trả focus về khi đóng.
    const opener = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevOverflow;
      // KHÔNG gọi dialog.close() ở đây: StrictMode (dev) chạy dọn dẹp rồi chạy lại effect
      // ngay — close() sẽ bắn sự kiện "close" → onClose → hộp tự đóng ngay khi vừa mở.
      // Khi đóng thật, <dialog> bị gỡ khỏi DOM là tự ra khỏi top layer.
      opener?.focus?.();
    };
  }, []);

  // Esc tự xử lý (đóng qua state → gỡ <dialog>) thay vì để trình duyệt tự đóng rồi chờ
  // sự kiện "close" (bắn bất đồng bộ — có môi trường không bắn kịp, hộp ẩn nhưng trang
  // vẫn bị khoá cuộn). Chặn luôn "cancel" gốc để chỉ còn 1 đường đóng.
  useEffect(() => {
    const dialog = ref.current;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (count > 1 && e.key === "ArrowRight") go(1);
      else if (count > 1 && e.key === "ArrowLeft") go(-1);
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    dialog?.addEventListener("cancel", onCancel);
    return () => {
      document.removeEventListener("keydown", onKey);
      dialog?.removeEventListener("cancel", onCancel);
    };
  }, [go, count, onClose]);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1);
  };

  const navButton = "flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25";

  return (
    <dialog
      ref={ref}
      aria-label={item.caption || "Xem ảnh"}
      onClose={onClose}
      // Bấm vào vùng tối bên ngoài khung nội dung thì đóng (target là chính <dialog>).
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="lightbox fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-white"
    >
      <div
        className="flex h-full w-full flex-col"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <span className="font-mono text-[12px] tracking-[0.2em] text-white/70">
            <span className="text-white">{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
          </span>
          <button type="button" onClick={onClose} aria-label="Đóng" autoFocus className={navButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className="relative flex flex-1 items-center justify-center gap-4 px-3 sm:px-6"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {count > 1 && (
            <button type="button" onClick={() => go(-1)} aria-label="Ảnh trước" className={cn(navButton, "hidden shrink-0 sm:flex")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}

          {/* key theo mục → mỗi lần chuyển, khung nội dung "bật" lên lại (CSS .lightbox-media) */}
          <div key={item.id} className="lightbox-media relative w-full max-w-[1200px]">
            {video ? (
              <VideoEmbed source={video} title={item.caption || "Video"} autoPlay />
            ) : (
              <div className="relative h-[min(72vh,820px)] w-full">
                <Image src={item.imageUrl} alt={item.caption} fill sizes="(max-width: 1200px) 100vw, 1200px" className="object-contain" priority />
                {item.videoUrl && (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-[14px] font-bold text-brand-900 shadow-2xl"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    Mở video ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {count > 1 && (
            <button type="button" onClick={() => go(1)} aria-label="Ảnh tiếp theo" className={cn(navButton, "hidden shrink-0 sm:flex")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-5 pb-6 pt-4 sm:px-8">
          <p className="min-w-0 text-[14.5px] leading-relaxed text-white/85">{item.caption}</p>
          {count > 1 && (
            <div className="flex shrink-0 gap-2 sm:hidden">
              <button type="button" onClick={() => go(-1)} aria-label="Ảnh trước" className={navButton}>‹</button>
              <button type="button" onClick={() => go(1)} aria-label="Ảnh tiếp theo" className={navButton}>›</button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
