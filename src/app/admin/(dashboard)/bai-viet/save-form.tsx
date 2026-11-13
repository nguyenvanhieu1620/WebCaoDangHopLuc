"use client";

import type { ReactNode } from "react";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { clearFailedPostSave } from "@/components/admin/PostFormGuard";
import type { AdminSaveResult } from "@/lib/admin-form";

export function PostSaveForm({ action, children, draftKey }: {
  action: (data: FormData) => Promise<AdminSaveResult>;
  children: ReactNode;
  draftKey: string;
}) {
  return (
    <AdminSaveForm
      action={action}
      unknownResultMessage="Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và danh sách bài viết trước khi thử lại."
      onFailure={() => clearFailedPostSave(draftKey)}
    >
      {children}
    </AdminSaveForm>
  );
}
