/**
 * Icon nét mảnh cho sidebar/bảng lệnh admin — vẽ inline SVG theo key thực thể
 * trong `ADMIN_NAV`, không thêm thư viện icon. Key không có trong bảng thì
 * hiện chấm tròn nhỏ (an toàn khi thêm entity mới mà chưa kịp vẽ icon).
 */
const PATHS: Record<string, string> = {
  dashboard: "M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-4H4z",
  posts: "M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h4",
  events: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  faq: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.5M12 17h.01",
  pages: "M7 3h7l5 5v13H7zM14 3v5h5",
  media: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01",
  programs: "M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6",
  faculty: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-3.5 3-6 7-6s7 2.5 7 6M17 3.5a4 4 0 010 7M22 21c0-3-1.7-5-4.5-5.7",
  "admissions-contact": "M4 4h16v12H4zM4 13h4l2 3h4l2-3h4M9 20h6",
  homepage: "M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5",
  menu: "M4 6h16M4 12h16M4 18h10",
  partners: "M8 12l3 3 5-5M12 21a9 9 0 100-18 9 9 0 000 18z",
  testimonials: "M4 5h16v11H9l-5 4zM8 9h8M8 12h5",
  "site-settings": "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z",
  users: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 16.5c.8-1.6 2.3-2.5 4-2.5s3.2.9 4 2.5",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  plus: "M12 5v14M5 12h14",
};

export function AdminIcon({ name, className }: { name: string; className?: string }) {
  const d = PATHS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-[18px] w-[18px]"}
    >
      {d ? <path d={d} /> : <circle cx="12" cy="12" r="2.5" />}
    </svg>
  );
}
