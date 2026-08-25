import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SITE, SITE_URL } from "@/lib/constants";
import { getLocale } from "@/lib/locale";

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
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
    <html lang={locale} className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
