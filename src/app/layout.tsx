import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { SITE, SITE_URL } from "@/lib/constants";
import { getLocale } from "@/lib/locale";

/**
 * Font duy nhất toàn site: Montserrat (giống VinUni) — dùng cho cả tiêu đề
 * (`font-display`), nội dung (`font-sans`) và nhãn in hoa (`font-mono`, xem
 * tailwind.config.ts). Bản variable: 1 file chứa mọi độ đậm 100–900, kèm bản
 * nghiêng cho chữ nhấn mạnh màu đỏ trong tiêu đề; có bộ ký tự tiếng Việt.
 */
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

const DESCRIPTION =
  "Trường Cao đẳng Y Dược Hợp Lực — đào tạo Điều dưỡng, Dược, Xét nghiệm Y học và các ngành y tế khác, gắn liền thực hành lâm sàng từ năm nhất.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.fullName} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: "en_US",
    siteName: SITE.fullName,
    title: `${SITE.fullName} | ${SITE.tagline}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.fullName} | ${SITE.tagline}`,
    description: DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    // data-scroll-behavior="smooth": Next tạm tắt cuộn mượt (globals.css) khi chuyển
    // trang để trang mới hiện ngay từ đầu, chỉ giữ cuộn mượt cho link neo (#dang-ky…).
    // suppressHydrationWarning: tiện ích trình duyệt (ColorZilla `cz-shortcut-listen`, Grammarly
    // `data-gr-ext-installed`, Dark Reader…) tự chèn thuộc tính vào <html>/<body> trước khi React
    // chạy → báo "hydration mismatch" giả. Chỉ bỏ qua thuộc tính của ĐÚNG 2 thẻ này, các thẻ con
    // vẫn được kiểm tra bình thường.
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={montserrat.variable}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
