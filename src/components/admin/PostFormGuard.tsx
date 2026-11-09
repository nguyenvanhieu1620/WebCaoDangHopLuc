"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

const PENDING_KEY = "hopluc-post-draft-pending";
const TEXT_FIELDS = new Set(["title", "excerpt", "content", "titleEn", "excerptEn", "contentEn", "categoryId"]);

function snapshot(form: HTMLFormElement) {
  return JSON.stringify([...new FormData(form)].filter(([key]) => !key.startsWith("$ACTION_")).map(([key, value]) =>
    [key, typeof value === "string" ? value : value.name ? [value.name, value.size, value.lastModified] : ""]
  ));
}

/** Bản tạm theo tài khoản/tab; chỉ lưu chữ, không lưu nội dung tệp lên trình duyệt. */
export function PostFormGuard({ draftKey }: { draftKey: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const leave = useRef(false);
  const pendingRef = useRef(false);
  const { pending } = useFormStatus();
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [backup, setBackup] = useState<Record<string, string> | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => {
    if (destination) dialog.current?.showModal();
    else dialog.current?.close();
  }, [destination]);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const baseline = snapshot(form);
    let last = baseline;
    let restoreFrame = 0;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt?: number; values?: Record<string, string> };
        if (parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000 && parsed.values) {
          const values = Object.fromEntries(Object.entries(parsed.values).filter(([key, value]) => TEXT_FIELDS.has(key) && typeof value === "string"));
          if (Object.keys(values).some((key) => new FormData(form).get(key) !== values[key])) restoreFrame = requestAnimationFrame(() => setBackup(values));
        }
      }
    } catch { /* Chặn storage không làm hỏng thao tác soạn bài. */ }

    const persist = () => {
      const current = snapshot(form);
      if (current === last) return;
      last = current;
      try {
        if (current === baseline) { sessionStorage.removeItem(draftKey); return; }
        const values = Object.fromEntries([...new FormData(form)].filter(([key, value]) => TEXT_FIELDS.has(key) && typeof value === "string"));
        sessionStorage.setItem(draftKey, JSON.stringify({ values, savedAt: Date.now() }));
      } catch { /* Vẫn cảnh báo rời trang nếu không lưu được bản tạm. */ }
    };
    const submit = () => {
      persist();
      try { sessionStorage.setItem(PENDING_KEY, draftKey); } catch { /* Storage tuỳ chọn. */ }
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      persist();
      if (!leave.current && !pendingRef.current && snapshot(form) !== baseline) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || leave.current) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (!["http:", "https:"].includes(url.protocol) || (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search)) return;
      persist();
      if (snapshot(form) === baseline) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setDestination(url.href);
    };
    // Toolbar Markdown và dịch tự động thay value trực tiếp: kiểm tra định kỳ để bản tạm cũng nhận được.
    const timer = window.setInterval(persist, 1000);
    form.addEventListener("input", persist);
    form.addEventListener("change", persist);
    form.addEventListener("submit", submit);
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      persist(); // Hỗ trợ quay lại bằng nút Back của trình duyệt bằng bản tạm.
      cancelAnimationFrame(restoreFrame);
      clearInterval(timer);
      form.removeEventListener("input", persist);
      form.removeEventListener("change", persist);
      form.removeEventListener("submit", submit);
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [draftKey]);

  return (
    <>
      <span ref={anchor} hidden />
      {backup && <div role="status" className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
        <p>Có bản tạm chưa lưu trên tab này. Khôi phục để tiếp tục soạn bài?</p>
        <div className="mt-3 flex gap-4">
          <button type="button" className="font-semibold text-brand-800 underline" onClick={() => {
            const form = anchor.current?.closest("form");
            if (!form) return;
            for (const [key, value] of Object.entries(backup)) {
              const field = form.elements.namedItem(key);
              if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
                field.value = value;
                field.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }
            setBackup(null); setRestored(true);
          }}>Khôi phục bản tạm</button>
          <button type="button" className="text-ink-soft underline" onClick={() => {
            try { sessionStorage.removeItem(draftKey); } catch { /* Storage tuỳ chọn. */ }
            setBackup(null);
          }}>Bỏ bản tạm</button>
        </div>
      </div>}
      {restored && <p role="status" className="text-sm text-brand-800">Đã khôi phục nội dung chữ. Kiểm tra lại ảnh, tệp đính kèm và trạng thái đăng trước khi lưu.</p>}
      <dialog ref={dialog} onCancel={(e) => { e.preventDefault(); setDestination(null); }} className="w-[min(92vw,460px)] rounded-2xl p-6 shadow-xl backdrop:bg-black/40" aria-label="Bài viết chưa lưu">
        <h2 className="text-lg font-bold text-brand-900">Bài viết có thay đổi chưa lưu</h2>
        <p className="mt-3 text-sm text-ink-soft">Bạn muốn tiếp tục soạn hay rời trang? Bản tạm chỉ giữ nội dung chữ trên tab này, không giữ tệp đã chọn.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" autoFocus onClick={() => setDestination(null)} className="rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white">Tiếp tục soạn</button>
          <button type="button" onClick={() => {
            if (!destination) return;
            leave.current = true;
            const url = new URL(destination);
            if (url.origin === location.origin) router.push(url.pathname + url.search + url.hash);
            else location.assign(destination);
          }} className="rounded-lg border border-line px-4 py-3 text-sm">Rời trang</button>
        </div>
      </dialog>
    </>
  );
}

/** Trang danh sách chỉ dọn đúng bản tạm vừa lưu thành công của tài khoản hiện tại. */
export function ClearSavedPostDraft({ saved, userId }: { saved: boolean; userId: string }) {
  useEffect(() => {
    if (!saved) return;
    try {
      const key = sessionStorage.getItem(PENDING_KEY);
      if (key?.startsWith(`hopluc-post:${userId}:`)) sessionStorage.removeItem(key);
      sessionStorage.removeItem(PENDING_KEY);
    } catch { /* Storage tuỳ chọn. */ }
  }, [saved, userId]);
  return null;
}
