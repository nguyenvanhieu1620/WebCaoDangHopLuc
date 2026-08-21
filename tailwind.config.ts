import type { Config } from "tailwindcss";

/**
 * Design tokens — Trường Cao đẳng Y Dược Hợp Lực
 * Nguồn màu: trích xuất từ logo chính thức của trường.
 * Giữ đồng bộ với bản thiết kế Claude Design (Home.dc.html, SiteHeader.dc.html...).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#06325A", // navy đậm nhất — nền tối, header gradient
          800: "#0A4E82",
          700: "#0B6CB0", // xanh chủ đạo — logo, link, nút phụ
          600: "#0E7FC4",
          500: "#1E9AD6", // xanh nhạt — gradient accent
          100: "#E4F1FA",
          50: "#F2F8FC",
        },
        accent: {
          700: "#9C161B",
          600: "#C41E24", // đỏ chủ đạo — CTA, nhấn mạnh
          500: "#E8562F", // cam-đỏ — gradient partner của accent-600
          100: "#FCE7E5",
        },
        paper: {
          DEFAULT: "#F7F9FB", // nền trang
          alt: "#EAF0F5", // nền section phụ
        },
        ink: {
          DEFAULT: "#0F1E29", // chữ chính
          soft: "#4C5E6B", // chữ phụ
          faint: "#8496A2", // chữ mờ / meta
        },
        line: "#DCE6ED",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      boxShadow: {
        sm2: "0 1px 2px rgba(15,30,41,0.06)",
        md2: "0 8px 24px rgba(10,55,90,0.10)",
        lg2: "0 24px 60px rgba(10,55,90,0.16)",
        red: "0 14px 34px rgba(196,30,36,0.28)",
        blue: "0 14px 34px rgba(11,108,176,0.24)",
      },
      borderRadius: {
        xl2: "20px",
        "2xl2": "28px",
      },
    },
  },
  plugins: [],
};
export default config;
