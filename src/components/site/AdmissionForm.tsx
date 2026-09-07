"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "./TurnstileWidget";

type AdmissionFormProps = {
  programs: { slug: string; name: string }[];
};

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500";
const labelClass = "mb-1.5 block text-xs font-semibold text-ink-soft";

/** Form đăng ký xét tuyển công khai — POST tới /api/admissions (endpoint gọi từ bên ngoài, xem CLAUDE.md mục 6.4). */
export function AdmissionForm({ programs }: AdmissionFormProps) {
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
      fullName: String(formData.get("fullName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      idNumber: String(formData.get("idNumber") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      program: String(formData.get("program") || "").trim(),
      note: String(formData.get("note") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      turnstileToken: String(formData.get("cf-turnstile-response") || "").trim(),
    };

    try {
      const res = await fetch("/api/admissions", {
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
        <div className="font-display text-lg font-semibold text-brand-900">
          Đã nhận hồ sơ đăng ký!
        </div>
        <p className="mt-2 text-[14px] text-ink-soft">
          Đội ngũ tư vấn tuyển sinh sẽ liên hệ với bạn trong thời gian sớm nhất.
          Bạn có thể dùng số CCCD vừa nhập để tra cứu trạng thái hồ sơ tại trang{" "}
          <a href="/tra-cuu-ket-qua" className="font-semibold text-brand-700 underline">
            Tra cứu kết quả
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          Đăng ký hồ sơ khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot chống bot — ẩn khỏi mắt/tab người dùng thật, bot điền form tự động thường vẫn điền vào. */}
      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Để trống trường này</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className={labelClass}>Họ và tên *</label>
        <input name="fullName" required className={inputClass} placeholder="Nguyễn Văn A" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Số điện thoại *</label>
          <input name="phone" required className={inputClass} placeholder="09xxxxxxxx" />
        </div>
        <div>
          <label className={labelClass}>Số CCCD *</label>
          <input name="idNumber" required className={inputClass} placeholder="0xxxxxxxxxxx" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Email (tuỳ chọn)</label>
        <input name="email" type="email" className={inputClass} placeholder="ban@email.com" />
      </div>
      <div>
        <label className={labelClass}>Ngành đăng ký *</label>
        <select name="program" required className={inputClass} defaultValue="">
          <option value="" disabled>
            — Chọn ngành —
          </option>
          {programs.map((p) => (
            <option key={p.slug} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Ghi chú (tuỳ chọn)</label>
        <textarea name="note" rows={3} className={inputClass} placeholder="Câu hỏi thêm nếu có..." />
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
        {status === "submitting" ? "Đang gửi..." : "Gửi hồ sơ đăng ký"}
      </button>
    </form>
  );
}
