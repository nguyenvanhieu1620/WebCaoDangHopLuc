"use client";

import { pageText } from "@/lib/page-copy";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatSiteDate } from "@/lib/site-copy";
import type { Locale } from "@/lib/locale";

type LookupResult = {
  fullName: string;
  program: string;
  statusLabel: string;
  createdAt: string;
};

/** Form tra cứu kết quả xét tuyển — POST tới /api/admissions/tra-cuu theo số CCCD. */
export function LookupForm({ locale = "vi" }: { locale?: Locale }) {
  const copy = pageText(locale);
  const [idNumber, setIdNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<LookupResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/admissions/tra-cuu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber: idNumber.trim(), locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(locale === "en" ? data.errorEn || copy("Có lỗi xảy ra, vui lòng thử lại.") : data.error || copy("Có lỗi xảy ra, vui lòng thử lại."));
        setStatus("error");
        return;
      }
      setResults(data.results);
      setStatus("done");
    } catch {
      setErrorMessage(copy("Không thể kết nối máy chủ, vui lòng thử lại."));
      setStatus("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          id="lookup-id-number"
          name="idNumber"
          autoComplete="off"
          aria-label={copy("Số CCCD đã đăng ký")}
          inputMode="numeric"
          pattern="[0-9]{12}"
          maxLength={12}
          title={copy("Số CCCD gồm 12 chữ số")}
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
          placeholder={copy("Nhập số CCCD đã đăng ký")}
          className="flex-1 rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "shrink-0 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 px-7 py-3.5 text-sm font-bold text-white shadow-blue transition-opacity",
            status === "loading" && "opacity-60"
          )}
        >
          {status === "loading" ? copy("Đang tra cứu...") : copy("Tra cứu")}
        </button>
      </form>

      {status === "error" && (
        <div role="alert" className="mt-4 rounded-xl bg-accent-100 px-4 py-3 text-sm font-semibold text-accent-700">
          {errorMessage}
        </div>
      )}

      {status === "done" && (
        <div role="status" className="mt-6">
          {results.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-6 text-center text-sm text-ink-faint">
              {locale === "en" ? "No applications were found for this citizen ID number. Check the number or contact the hotline for support." : "Không tìm thấy hồ sơ nào với số CCCD này. Kiểm tra lại số đã nhập hoặc liên hệ hotline để được hỗ trợ."}
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-line bg-white p-5 shadow-sm2"
                >
                  <div className="font-display text-base font-semibold text-ink">
                    {r.fullName} — {r.program}
                  </div>
                  <div className="mt-1.5 text-[13.5px] text-brand-700">{r.statusLabel}</div>
                  <div className="mt-1 font-mono text-[11px] text-ink-faint">
                    {copy("Ngày đăng ký:")} {formatSiteDate(r.createdAt, locale)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
