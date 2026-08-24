"use client";

import type { ReactNode } from "react";

type ConfirmDeleteButtonProps = {
  children: ReactNode;
  className?: string;
  /** Câu hỏi xác nhận — mặc định chung, có thể ghi rõ hơn tên mục sắp xoá. */
  confirmMessage?: string;
};

/**
 * Nút "Xoá" dùng chung cho mọi form xoá trong admin — chặn submit nếu người
 * dùng bấm "Huỷ" ở hộp thoại xác nhận, tránh xoá nhầm dữ liệu. Đặt bên trong
 * <form action={deleteXxxAction}> như 1 button submit bình thường.
 */
export function ConfirmDeleteButton({
  children,
  className,
  confirmMessage = "Bạn chắc chắn muốn xoá? Không thể hoàn tác.",
}: ConfirmDeleteButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
