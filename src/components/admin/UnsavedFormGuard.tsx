"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { snapshotAdminForm } from "@/lib/admin-form";

export function UnsavedFormGuard({
  subject,
  leaveMessage = "Nếu rời trang, các thay đổi vừa nhập sẽ bị mất.",
}: { subject: string; leaveMessage?: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const leaving = useRef(false);
  const pendingRef = useRef(false);
  const { pending } = useFormStatus();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => {
    if (destination) dialog.current?.showModal();
    else dialog.current?.close();
  }, [destination]);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const baseline = snapshotAdminForm(form);
    const hasUnsavedChanges = () =>
      !leaving.current && !pendingRef.current && snapshotAdminForm(form) !== baseline;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (!["http:", "https:"].includes(url.protocol) || (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search)) return;
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setDestination(url.href);
    };

    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);

  return (
    <>
      <span ref={anchor} hidden />
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault();
          setDestination(null);
        }}
        className="w-[min(92vw,460px)] rounded-2xl p-6 shadow-xl backdrop:bg-black/40"
      >
        <h2 id={titleId} className="text-lg font-bold text-brand-900">{subject} có thay đổi chưa lưu</h2>
        <p id={descriptionId} className="mt-3 text-sm text-ink-soft">{leaveMessage}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" autoFocus onClick={() => setDestination(null)} className="min-h-11 rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white">
            Tiếp tục sửa
          </button>
          <button
            type="button"
            onClick={() => {
              if (!destination) return;
              leaving.current = true;
              const url = new URL(destination);
              if (url.origin === location.origin) router.push(url.pathname + url.search + url.hash);
              else location.assign(destination);
            }}
            className="min-h-11 rounded-lg border border-line px-4 py-3 text-sm"
          >
            Rời trang
          </button>
        </div>
      </dialog>
    </>
  );
}
