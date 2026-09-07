"use client";

import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Widget xác minh "không phải bot" (Cloudflare Turnstile) — chỉ render khi
 * đã cấu hình `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (để trống thì component trả
 * `null`, form vẫn gửi bình thường, chỉ dựa vào honeypot). Đặt bên trong
 * `<form>` cha — script Turnstile tự nhận diện div `.cf-turnstile` và tự
 * chèn 1 input ẩn tên `cf-turnstile-response` bên trong (cơ chế "implicit
 * render" chính thức của Turnstile), đọc được thẳng qua `formData.get(...)`
 * như field bình thường, không cần gọi API JS thủ công.
 */
export function TurnstileWidget({ compact }: { compact?: boolean }) {
  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div
        className="cf-turnstile"
        data-sitekey={SITE_KEY}
        data-theme="light"
        data-size={compact ? "compact" : "normal"}
      />
    </>
  );
}
