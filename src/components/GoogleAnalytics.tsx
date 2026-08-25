import Script from "next/script";

/**
 * Gắn Google Analytics (gtag.js) — chỉ render khi có
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` (xem `.env.example`), để trống thì
 * layout không render component này, site không gọi domain ngoài nào.
 * Domain `googletagmanager.com`/`google-analytics.com` đã được thêm riêng
 * vào Content-Security-Policy (`next.config.js`) khi biến này có giá trị.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
