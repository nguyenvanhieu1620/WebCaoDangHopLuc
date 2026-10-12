"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IMAGE_SPECS, assessImage, type ImageSpecKey } from "@/lib/image-specs";
import { MAX_UPLOAD_BYTES, checkUpload, formatBytes } from "@/lib/upload-rules";

type MediaOption = { id: string; url: string; filename: string };

type ImagePickerProps = {
  /** Tên field input file — action đọc qua saveUploadedFileIfPresent/resolveImageUrl. */
  fileFieldName: string;
  /** Tên field ẩn chứa URL ảnh chọn từ thư viện — action đọc bằng resolveImageUrl(). */
  pickedFieldName: string;
  /** Danh sách ảnh có sẵn trong Thư viện media (chỉ ảnh, không lấy video). */
  images: MediaOption[];
  /** URL ảnh hiện tại khi đang sửa — hiện làm ảnh xem trước mặc định. */
  currentUrl?: string | null;
  /** Loại ô ảnh (src/lib/image-specs.ts) — quyết định gợi ý kích thước + cảnh báo ảnh nhỏ/sai hướng. */
  spec: ImageSpecKey;
  /** Form đã tự hiện ảnh đang dùng (VD thẻ Banner trang con) → không lặp ảnh nhỏ, vẫn đo + cảnh báo. */
  hideCurrentPreview?: boolean;
};

const isJpegUrl = (url: string) => /\.jpe?g($|\?)/i.test(url);

/**
 * Chọn ảnh cho 1 field trong form admin — tải file mới HOẶC chọn lại ảnh đã có sẵn trong
 * Thư viện media (đỡ phải tải trùng ảnh nhiều lần). Dùng ở mọi ô ảnh của admin.
 *
 * - Hiện gợi ý kích thước theo `spec` (đo từ khung hiển thị thật ở web công khai).
 * - File sai định dạng / quá dung lượng / HEIC bị chặn NGAY khi chọn (báo lỗi đỏ, bỏ file
 *   khỏi ô) — không để admin bấm Lưu rồi mới gặp trang lỗi. Cùng quy tắc với máy chủ
 *   (src/lib/upload-rules.ts).
 * - Đo kích thước thật của ảnh đang xem trước (file mới, ảnh chọn từ thư viện, hoặc ảnh
 *   đang dùng) → cảnh báo vàng nếu nhỏ hơn khuyến nghị/sai hướng. Chỉ cảnh báo, vẫn cho lưu.
 */
export function ImagePicker({ fileFieldName, pickedFieldName, images, currentUrl, spec, hideCurrentPreview }: ImagePickerProps) {
  const info = IMAGE_SPECS[spec];
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<{ name: string; url: string; isJpeg: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [dims, setDims] = useState<{ src: string; w: number; h: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSrc = newFile?.url ?? pickedUrl ?? currentUrl ?? null;
  const sourceLabel = newFile ? "File mới" : pickedUrl ? "Ảnh chọn từ thư viện" : "Ảnh đang dùng";
  const isJpeg = newFile ? newFile.isJpeg : previewSrc ? isJpegUrl(previewSrc) : false;
  const measured = dims && dims.src === previewSrc ? dims : null;
  const notices = measured ? assessImage(info, measured.w, measured.h, isJpeg) : [];

  // Đo kích thước thật của ảnh đang xem trước (kể cả ảnh cũ khi đang sửa).
  useEffect(() => {
    if (!previewSrc) return;
    let alive = true;
    const img = new window.Image();
    img.onload = () => {
      if (alive) setDims({ src: previewSrc, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = previewSrc;
    return () => {
      alive = false;
    };
  }, [previewSrc]);

  // Giải phóng URL xem trước của file mới khi rời trang.
  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function replaceObjectUrl(next: string | null) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = next;
  }

  const frame = spec === "logo" ? "w-36 bg-white" : info.shape === "portrait" ? "w-[60px]" : "w-36";
  const fit = spec === "logo" ? "object-contain p-1" : "object-cover";
  const minText = info.minWidth ? `tối thiểu ${info.minWidth}×${info.minHeight}` : `cao tối thiểu ${info.minHeight}px`;

  return (
    <div>
      {previewSrc && !(hideCurrentPreview && !newFile && !pickedUrl) && (
        <div className="mb-2 flex items-end gap-3">
          <div className={cn("relative h-20 shrink-0 overflow-hidden rounded-lg border border-line", frame)}>
            {newFile ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước từ file trên máy (blob:), next/image không tối ưu được
              <img src={newFile.url} alt="Xem trước" className={cn("h-full w-full", fit)} />
            ) : (
              <Image src={previewSrc} alt="Xem trước" fill sizes="144px" className={fit} />
            )}
          </div>
          <div className="min-w-0 pb-0.5 text-[11.5px] text-ink-faint">
            <div className="truncate">{sourceLabel}{newFile ? `: ${newFile.name}` : ""}</div>
            {measured && <div className="font-mono text-ink-soft">{measured.w}×{measured.h}px</div>}
          </div>
        </div>
      )}

      <input type="hidden" name={pickedFieldName} value={pickedUrl ?? ""} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          name={fileFieldName}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              replaceObjectUrl(null);
              setNewFile(null);
              setError(null);
              return;
            }
            const problem = checkUpload(file, ["image"]);
            if (problem) {
              // Bỏ file khỏi ô → bấm Lưu vẫn an toàn (giữ ảnh cũ), không gửi file sai lên máy chủ.
              e.target.value = "";
              replaceObjectUrl(null);
              setNewFile(null);
              setError(problem);
              return;
            }
            const url = URL.createObjectURL(file);
            replaceObjectUrl(url);
            setNewFile({ name: file.name, url, isJpeg: file.type === "image/jpeg" });
            setError(null);
            setPickedUrl(null);
            setShowLibrary(false);
          }}
          // max-w-full: ô chọn file có độ rộng cố định của trình duyệt, lố khung ở màn hình ~345px.
          className="min-w-0 max-w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
        />
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className="text-[12px] font-semibold text-brand-700 hover:underline"
          >
            {showLibrary ? "Đóng thư viện" : "Chọn ảnh có sẵn"}
          </button>
        )}
      </div>

      {showLibrary && (
        <div className="mt-2 grid max-h-48 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-6">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              title={img.filename}
              onClick={() => {
                // Bỏ file mới đã chọn (nếu có): máy chủ ưu tiên file tải lên hơn ảnh chọn từ thư
                // viện (resolveImageUrl), còn giữ file trong ô thì ảnh vừa chọn sẽ bị bỏ qua.
                if (fileInputRef.current) fileInputRef.current.value = "";
                replaceObjectUrl(null);
                setNewFile(null);
                setError(null);
                setPickedUrl(img.url);
                setShowLibrary(false);
              }}
              className={cn(
                "relative h-14 overflow-hidden rounded-md border-2",
                pickedUrl === img.url ? "border-brand-600" : "border-transparent"
              )}
            >
              <Image src={img.url} alt={img.filename} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-accent-600 px-3 py-2 text-[12px] font-semibold leading-relaxed text-white">
          ✕ {error}
        </p>
      )}

      <div aria-live="polite">
        {notices.map((n) =>
          n.level === "warn" ? (
            <p key={n.text} className="mt-2 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-[12px] leading-relaxed text-accent-700">
              ⚠️ {n.text}
            </p>
          ) : (
            <p key={n.text} className="mt-2 text-[12px] font-semibold text-brand-700">✓ {n.text}</p>
          )
        )}
      </div>

      <div className="mt-2 rounded-lg bg-paper-alt/70 px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft">
        <b className="text-ink">Khuyến nghị:</b> {spec === "logo" ? "logo nằm ngang" : `ảnh ${info.shape === "portrait" ? "dọc" : "ngang"} ${info.ratio}`},{" "}
        {minText}, đẹp nhất {info.ideal} · {info.transparent ? "PNG nền trong suốt" : "JPG/PNG/WEBP"}, tối đa {formatBytes(MAX_UPLOAD_BYTES.image)}.
        <br />
        {info.where} {info.tip}
      </div>
    </div>
  );
}
