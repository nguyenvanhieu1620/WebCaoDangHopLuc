"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "./TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500";
const labelClass = "mb-1.5 block text-xs font-semibold text-ink-soft";

/** Form gửi câu hỏi công khai ở /lien-he — POST tới /api/contact (endpoint gọi từ bên ngoài). */
export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Chụp lại tham chiếu form ngay lập tức — sau `await`, SyntheticEvent.currentTarget có thể đã bị React dọn.
    const form = e.currentTarget;
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      turnstileToken: String(formData.get("cf-turnstile-response") || "").trim(),
    };

    try {
      const res = await fetch("/api/contact", {
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
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <div className="font-display text-lg font-semibold text-brand-900">Đã gửi câu hỏi!</div>
        <p className="mt-2 text-[14px] text-ink-soft">
          Đội ngũ nhà trường sẽ phản hồi bạn trong thời gian sớm nhất.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          Gửi câu hỏi khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Để trống trường này</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className={labelClass}>Họ và tên *</label>
        <input name="name" required className={inputClass} placeholder="Nguyễn Văn A" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Số điện thoại (tuỳ chọn)</label>
          <input name="phone" className={inputClass} placeholder="09xxxxxxxx" />
        </div>
        <div>
          <label className={labelClass}>Email (tuỳ chọn)</label>
          <input name="email" type="email" className={inputClass} placeholder="ban@email.com" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Nội dung *</label>
        <textarea
          name="message"
          required
          rows={4}
          className={inputClass}
          placeholder="Câu hỏi hoặc nội dung cần trao đổi..."
        />
      </div>

      <TurnstileWidget />

      {status === "error" && (
        <div className="rounded-xl bg-accent-100 px-4 py-3 text-sm font-semibold text-accent-700">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(
          "w-full rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 py-3.5 text-sm font-bold text-white shadow-red transition-opacity",
          status === "submitting" && "opacity-60"
        )}
      >
        {status === "submitting" ? "Đang gửi..." : "Gửi liên hệ"}
      </button>
    </form>
  );
}
