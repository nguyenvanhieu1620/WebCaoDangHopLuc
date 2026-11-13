"use client";

import { useState } from "react";
import { safeHref } from "@/lib/safe-href";
import { MENU_HREF_ERROR } from "./validation";

export function MenuHrefField({ defaultValue }: { defaultValue?: string }) {
  const [showError, setShowError] = useState(false);

  return (
    <div>
      <label htmlFor="f-menu-href" className="mb-1.5 block text-xs font-semibold text-ink-soft">Đường dẫn</label>
      <input
        id="f-menu-href"
        name="href"
        required
        defaultValue={defaultValue}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? "menu-href-error" : undefined}
        onChange={(event) => {
          const field = event.currentTarget;
          const invalid = !!field.value && !safeHref(field.value);
          field.setCustomValidity(invalid ? MENU_HREF_ERROR : "");
          if (!invalid) setShowError(false);
        }}
        onBlur={(event) => setShowError(event.currentTarget.validity.customError)}
        onInvalid={(event) => setShowError(event.currentTarget.validity.customError)}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        placeholder="VD: /nganh-dao-tao"
      />
      {showError && <p id="menu-href-error" role="alert" className="mt-1.5 text-xs text-accent-700">{MENU_HREF_ERROR}</p>}
    </div>
  );
}
