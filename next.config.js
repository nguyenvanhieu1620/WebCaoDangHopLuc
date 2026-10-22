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
// Turnstile (chống bot/spam ở form tuyển sinh/liên hệ/newsletter) cần chạy
// script + mở iframe từ challenges.cloudflare.com — chỉ nới CSP khi thực sự
// có gắn (xem src/lib/turnstile.ts), giữ nguyên tắc "chưa dùng thì không mở".
const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}${hasGA ? " https://www.googletagmanager.com" : ""}${hasTurnstile ? " https://challenges.cloudflare.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${hasGA ? " https://www.google-analytics.com" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${hasGA ? " https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com" : ""}${hasTurnstile ? " https://challenges.cloudflare.com" : ""}`,
  // youtube-nocookie.com: lightbox Thư viện phát video YouTube ngay trên trang
  // (src/components/site/Lightbox.tsx) — bản "không cookie", không theo dõi
  // khách tới khi bấm phát. Chỉ mở frame, không mở script/connect của YouTube.
  `frame-src 'self' https://www.youtube-nocookie.com${hasTurnstile ? " https://challenges.cloudflare.com" : ""}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Cho phép mở `npm run dev` trên ĐIỆN THOẠI THẬT cùng mạng Wi-Fi/LAN qua
 * http://<IP-máy-tính>:3000 — Next.js 16 mặc định chặn tài nguyên dev (JS,
 * HMR) khi truy cập bằng host khác `localhost`, khiến trang hiện ra nhưng
 * không chạy JS (mất hiệu ứng, form, menu). Tự lấy mọi IPv4 LAN của máy đang
 * chạy dev (đổi mạng/DHCP đổi IP vẫn đúng, không phải sửa tay). Tuỳ chọn này
 * chỉ có tác dụng ở chế độ dev, không ảnh hưởng production.
 */
const lanDevOrigins = Object.values(require("node:os").networkInterfaces())
  .flat()
  .filter((net) => net && net.family === "IPv4" && !net.internal)
  .map((net) => net.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Không gửi header "X-Powered-By: Next.js" — bớt lộ công nghệ/phiên bản cho kẻ dò lỗ hổng.
  poweredByHeader: false,
  allowedDevOrigins: lanDevOrigins,
  experimental: {
    // Form admin tải ảnh/video/tài liệu qua Server Action. Mặc định Next chỉ nhận
    // body 1MB (Server Action) / 10MB (request đi qua proxy.ts) → ảnh > 1MB lỗi âm
    // thầm dù src/lib/media.ts cho phép ảnh 10MB, tài liệu 20MB, video 50MB. Nâng lên
    // 55MB cho khớp mức tối đa đó (+ phần dư của các field khác trong form).
    serverActions: { bodySizeLimit: "55mb" },
    proxyClientMaxBodySize: "55mb",
  },
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
