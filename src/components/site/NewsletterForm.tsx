"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "./TurnstileWidget";

/** Form đăng ký nhận bản tin ở Footer — POST tới /api/newsletter. */
export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      turnstileToken: String(formData.get("cf-turnstile-response") || "").trim(),
    };

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setErrorMessage("Không thể kết nối máy chủ, vui lòng thử lại.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p className="text-[13px] font-semibold text-white/90">Đã đăng ký nhận tin, cảm ơn bạn!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="newsletter-website">Để trống trường này</label>
        <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Email của bạn"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] text-white placeholder:text-white/50 outline-none focus:border-white/50"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "shrink-0 rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-bold text-brand-900 transition-opacity",
            status === "submitting" && "opacity-60"
          )}
        >
          {status === "submitting" ? "..." : "Đăng ký"}
        </button>
      </div>
      <TurnstileWidget compact />
      {status === "error" && <p className="text-[11.5px] font-semibold text-accent-200">{errorMessage}</p>}
    </form>
  );
}
