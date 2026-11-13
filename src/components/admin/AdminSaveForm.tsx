"use client";

import { useActionState, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { AdminSaveFeedback } from "@/components/admin/AdminSaveFeedback";
import type { AdminSaveResult } from "@/lib/admin-form";

const initialState: AdminSaveResult = { message: "" };

export function AdminSaveForm({ action, children, unknownResultMessage, onFailure, className = "space-y-5", successNotice }: {
  action: (data: FormData) => Promise<AdminSaveResult>;
  children: ReactNode;
  unknownResultMessage: string;
  onFailure?: () => void;
  className?: string;
  successNotice?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(async (_previous: AdminSaveResult, data: FormData) => {
    let result: AdminSaveResult;
    try {
      result = await action(data);
    } catch (error) {
      unstable_rethrow(error);
      result = { message: unknownResultMessage };
    }
    if (result?.message) onFailure?.();
    return result ?? initialState;
  }, initialState);

  return (
    // Giữ các ô đang soạn và file đã chọn nếu action trả về lỗi.
    <form action={formAction} onReset={(event) => event.preventDefault()} className={className}>
      <AdminSaveFeedback state={state} />
      {!pending && !state.message && successNotice}
      {children}
    </form>
  );
}
