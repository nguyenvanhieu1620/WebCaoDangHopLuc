"use client";

import { useState, type InputHTMLAttributes } from "react";
import { checkUpload, type UploadKind } from "@/lib/upload-rules";

type CheckedFileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  /** Loại file ô này nhận — kiểm tra cùng quy tắc với máy chủ (src/lib/upload-rules.ts). */
  kinds: UploadKind[];
};

/**
 * `<input type="file">` có kiểm tra ngay khi chọn: file sai định dạng / quá dung lượng /
 * HEIC bị bỏ khỏi ô và báo lỗi tại chỗ, thay vì gửi lên rồi mới ra trang lỗi. Dùng cho ô
 * tải file không phải ImagePicker (Thư viện media, tệp đính kèm bài viết).
 */
export function CheckedFileInput({ kinds, multiple, ...props }: CheckedFileInputProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  return (
    <>
      <input
        {...props}
        type="file"
        multiple={multiple}
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          const problems = files.map((f) => checkUpload(f, kinds)).filter((p): p is string => !!p);
          if (problems.length) {
            // Bỏ cả lượt chọn (trình duyệt không cho bỏ riêng 1 file) → chọn lại các file hợp lệ.
            e.target.value = "";
            setCount(0);
          } else {
            setCount(files.length);
          }
          setErrors(problems);
        }}
      />
      {errors.length > 0 && (
        <div role="alert" className="mt-2 w-full space-y-1 rounded-lg bg-accent-600 px-3 py-2 text-left text-[12px] font-semibold leading-relaxed text-white">
          {errors.map((p) => (
            <p key={p}>✕ {p}</p>
          ))}
          {multiple && <p className="font-normal text-white/85">Chưa tải lên tệp nào — chọn lại, bỏ các tệp bị báo lỗi.</p>}
        </div>
      )}
      {multiple && count > 1 && errors.length === 0 && (
        <p className="mt-1 text-[12px] font-semibold text-brand-700">✓ Đã chọn {count} tệp hợp lệ.</p>
      )}
    </>
  );
}
