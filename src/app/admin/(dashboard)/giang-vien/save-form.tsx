"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { AdminSaveFeedback } from "@/components/admin/AdminSaveFeedback";
import { RESTORE_ADMIN_FORM_DRAFT } from "@/lib/admin-form";
import type { FacultySaveResult } from "./actions";
import {
  captureFacultyDraft,
  facultyDraftChanges,
  parseFacultyDraft,
  removeSavedFacultyDraft,
  type FacultyDraft,
  type FacultyDraftContent,
} from "./draft";

function storeDraft(key: string, draft: FacultyDraft | null) {
  try {
    if (draft) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch { /* Có trình duyệt chặn hoặc giới hạn dung lượng lưu tạm. */ }
}

function storeChanges(key: string, version: string, original: FacultyDraftContent, current: FacultyDraftContent, token?: string) {
  const changes = facultyDraftChanges(original, current);
  const hasDraft = changes.reselectPhoto || Object.keys(changes.values).length > 0 || Boolean(token);
  storeDraft(key, hasDraft ? { ...changes, version, savedAt: Date.now(), token } : null);
}

function readDraft(key: string) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const draft = parseFacultyDraft(raw);
    if (!draft) storeDraft(key, null);
    return draft;
  } catch {
    return null;
  }
}

export function FacultySaveForm({
  action,
  children,
  draftKey,
  draftVersion,
}: {
  action: (formData: FormData) => Promise<FacultySaveResult>;
  children: ReactNode;
  draftKey: string;
  draftVersion: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const originalDraft = useRef<FacultyDraftContent>({ values: {}, reselectPhoto: false });
  const lastSnapshot = useRef("");
  const [backup, setBackup] = useState<FacultyDraft | null>(null);
  const [restored, setRestored] = useState<FacultyDraft | null>(null);
  const [state, formAction] = useActionState(async (_previous: FacultySaveResult, formData: FormData) => {
    const content = captureFacultyDraft(formData);
    const snapshot = JSON.stringify(content);
    // Chỉ gắn mã dọn cho đúng nội dung vừa gửi, để sửa tiếp trong lúc chờ không bị xóa.
    if (
      (snapshot !== JSON.stringify(originalDraft.current) || restored) &&
      form.current && JSON.stringify(captureFacultyDraft(new FormData(form.current))) === snapshot
    ) {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      lastSnapshot.current = snapshot;
      storeChanges(draftKey, draftVersion, originalDraft.current, content, token);
      formData.set("facultyDraftToken", token);
    }
    try {
      return await action(formData);
    } catch (error) {
      unstable_rethrow(error);
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và danh sách giảng viên trước khi thử lại." };
    }
  }, { message: "" });

  useEffect(() => {
    const element = form.current;
    if (!element) return;
    const original = captureFacultyDraft(new FormData(element));
    originalDraft.current = original;
    lastSnapshot.current = JSON.stringify(original);
    const draft = readDraft(draftKey);
    const differs = draft && (draft.reselectPhoto || Object.entries(draft.values).some(([key, value]) => original.values[key] !== value));
    const frame = differs ? requestAnimationFrame(() => setBackup(draft)) : 0;

    const persist = () => {
      if (!element.elements.namedItem("name")) return;
      const content = captureFacultyDraft(new FormData(element));
      const snapshot = JSON.stringify(content);
      if (snapshot === lastSnapshot.current) return;
      lastSnapshot.current = snapshot;
      storeChanges(draftKey, draftVersion, original, content);
    };
    // Toolbar và dịch tự động có thể đổi DOM mà không phát sự kiện input.
    const timer = window.setInterval(persist, 1000);
    for (const event of ["input", "change", "submit"]) element.addEventListener(event, persist);
    window.addEventListener("popstate", persist);
    window.addEventListener("pagehide", persist);
    return () => {
      persist();
      cancelAnimationFrame(frame);
      clearInterval(timer);
      for (const event of ["input", "change", "submit"]) element.removeEventListener(event, persist);
      window.removeEventListener("popstate", persist);
      window.removeEventListener("pagehide", persist);
    };
  }, [draftKey, draftVersion]);

  function restoreDraft(draft: FacultyDraft) {
    const element = form.current;
    if (!element) return;
    for (const [key, value] of Object.entries(draft.values)) {
      if (key === "photoExisting") continue;
      const field = element.elements.namedItem(key);
      if (field instanceof HTMLSelectElement && !Array.from(field.options).some((option) => option.value === value)) continue;
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
    }
    const detail = draft.reselectPhoto ? { ...draft.values, photoExisting: "" } : draft.values;
    element.dispatchEvent(new CustomEvent(RESTORE_ADMIN_FORM_DRAFT, { detail }));
    setRestored(draft);
    setBackup(null);
  }

  function discardDraft() {
    const element = form.current;
    if (!element) return;
    const content = captureFacultyDraft(new FormData(element));
    lastSnapshot.current = JSON.stringify(content);
    storeChanges(draftKey, draftVersion, originalDraft.current, content);
    setBackup(null);
  }

  return (
    <form
      ref={form}
      action={formAction}
      // React tự reset form khi action trả về. Giữ cả nội dung và tệp để sửa lỗi rồi thử lại.
      onReset={(event) => event.preventDefault()}
      className="space-y-5"
    >
      {backup && (
        <div role="status" className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <p className="font-semibold">Có bản tạm chưa lưu của hồ sơ này trong tab hiện tại.</p>
          {backup.version !== draftVersion && <p className="mt-2">Hồ sơ trên máy chủ đã thay đổi. Kiểm tra kỹ nội dung nếu chọn khôi phục.</p>}
          {backup.reselectPhoto && <p className="mt-2">Ảnh tải từ máy cần chọn lại.</p>}
          <div className="mt-2 flex flex-wrap gap-x-4">
            <button type="button" className="min-h-11 font-semibold underline" onClick={() => restoreDraft(backup)}>
              Khôi phục bản tạm
            </button>
            <button type="button" className="min-h-11 text-ink-soft underline" onClick={discardDraft}>
              Bỏ bản tạm
            </button>
          </div>
        </div>
      )}
      {restored && (
        <p role="status" className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
          Đã khôi phục bản tạm. Kiểm tra lại nội dung và ảnh trước khi lưu.
          {restored.reselectPhoto && " Ảnh tải từ máy cần chọn lại."}
        </p>
      )}
      <AdminSaveFeedback state={state} />
      {children}
    </form>
  );
}

export function ClearSavedFacultyDraft({ userId, token }: { userId: string; token?: string | string[] }) {
  useEffect(() => {
    try {
      removeSavedFacultyDraft(sessionStorage, userId, token);
    } catch { /* Lưu tạm là tùy chọn của trình duyệt. */ }
  }, [token, userId]);
  return null;
}
