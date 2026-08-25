/**
 * Content-Security-Policy — giữ `unsafe-inline` cho script/style vì Next.js
 * App Router tự chèn <script> inline không kèm nonce để hydrate (RSC
 * streaming payload `self.__next_f.push(...)`), và Tailwind + vài chỗ dùng
 * style inline (VD `style={{transitionDelay}}` ở Reveal/QuickContactWidget).
 * Set CSP nonce-based "chuẩn" hơn cần sinh nonce mỗi request qua proxy.ts +
 * đọc lại đúng cách trong mọi Client Component — việc lớn hơn, để dành làm
 * sau nếu thực sự cần siết chặt hơn.
 *
 * Bù lại, phần có giá trị bảo mật thật của CSP vẫn giữ nguyên: chặn tải
 * script/style/ảnh/font từ domain lạ (chặn injection chèn script ngoài),
 * chặn iframe nhúng từ site khác, ép mọi fetch/XHR chỉ gọi về chính site.
 * An toàn để bật vì site này KHÔNG dùng `dangerouslySetInnerHTML` hay embed
 * iframe ở đâu cả (nội dung admin nhập luôn qua react-markdown, xem mục 6
 * quy ước "Soạn nội dung có định dạng").
 */
// React dev mode dùng eval() để dựng lại stack trace phục vụ debug (React
// tự khẳng định KHÔNG BAO GIỜ dùng eval() ở production) — CSP chặn eval()
// sẽ chỉ in cảnh báo vô hại lúc `npm run dev`, nhưng để sạch console lúc
// dev vẫn nên nới `unsafe-eval` riêng cho môi trường dev, giữ production
// chặt như bình thường.
// Chỉ nới CSP cho domain Google Analytics khi thực sự có gắn GA (biến môi
// trường NEXT_PUBLIC_GA_MEASUREMENT_ID có giá trị) — chưa cấu hình thì CSP
// giữ nguyên chặt, không tự mở domain ngoài cho tính năng chưa dùng.
const hasGA = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}${hasGA ? " https://www.googletagmanager.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${hasGA ? " https://www.google-analytics.com" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${hasGA ? " https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com" : ""}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Áp dụng cho mọi route — chặn vài lớp tấn công phổ biến cơ bản
        // (clickjacking, MIME-sniffing, rò rỉ Referer) mà không cần cấu hình gì thêm.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
