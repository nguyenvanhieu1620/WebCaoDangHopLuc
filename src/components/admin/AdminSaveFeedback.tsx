"use client";

import { useEffect, useRef } from "react";
import type { AdminSaveResult } from "@/lib/admin-form";

export function AdminSaveFeedback({ state }: { state: AdminSaveResult }) {
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state.message) return;
    feedback.current?.focus({ preventScroll: true });
    feedback.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [state]);

  if (!state.message) return null;
  return (
    <div ref={feedback} role="alert" tabIndex={-1} className="rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-accent-700">
      <p className="font-semibold">{state.message}</p>
      {state.fields && (
        <ul className="mt-2 space-y-1">
          {Object.entries(state.fields).map(([name, message]) => (
            <li key={name}>
              <button
                type="button"
                className="min-h-11 py-1 text-left underline"
                onClick={(event) => {
                  const field = event.currentTarget.form?.elements.namedItem(name);
                  if (!(field instanceof HTMLElement)) return;
                  const focus = () => {
                    field.focus({ preventScroll: true });
                    field.scrollIntoView({ block: "center", behavior: "instant" });
                  };
                  if (field instanceof HTMLTextAreaElement && field.getClientRects().length === 0) {
                    // MarkdownEditor đã mở lại ô nhập khi nhận sự kiện invalid.
                    field.dispatchEvent(new Event("invalid", { cancelable: true }));
                    requestAnimationFrame(focus);
                  } else {
                    focus();
                  }
                }}
              >
                {message}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
