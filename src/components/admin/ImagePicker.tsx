"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
};

/**
 * Chọn ảnh cho 1 field trong form admin — tải file mới HOẶC chọn lại ảnh đã
 * có sẵn trong Thư viện media (đỡ phải tải trùng ảnh nhiều lần). Dùng chung
 * cho: Giảng viên, Đánh giá, Thư viện Trang chủ, Bài viết (ảnh đại diện),
 * Nội dung Trang chủ (ảnh Hero).
 */
export function ImagePicker({ fileFieldName, pickedFieldName, images, currentUrl }: ImagePickerProps) {
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const previewUrl = pickedUrl ?? currentUrl ?? null;

  return (
    <div>
      {previewUrl && !newFileName && (
        <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg border border-line">
          <Image src={previewUrl} alt="Xem trước" fill className="object-cover" />
        </div>
      )}
      {newFileName && (
        <div className="mb-2 text-[12.5px] text-ink-soft">Đã chọn file mới: {newFileName}</div>
      )}

      <input type="hidden" name={pickedFieldName} value={pickedUrl ?? ""} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name={fileFieldName}
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setNewFileName(file ? file.name : null);
            if (file) {
              setPickedUrl(null);
              setShowLibrary(false);
            }
          }}
          className="text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
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
                setPickedUrl(img.url);
                setNewFileName(null);
                setShowLibrary(false);
              }}
              className={cn(
                "relative h-14 overflow-hidden rounded-md border-2",
                pickedUrl === img.url ? "border-brand-600" : "border-transparent"
              )}
            >
              <Image src={img.url} alt={img.filename} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
