import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Ảnh hiện ra khi chia sẻ link website lên Facebook/Zalo/Messenger — Next.js
 * tự nhận diện file này và gắn vào thẻ Open Graph cho MỌI trang không tự
 * khai báo ảnh riêng, không cần thêm code ở từng `page.tsx`.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06325A 0%, #0B6CB0 60%, #1E9AD6 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 34,
            fontWeight: 700,
            color: "#F7F9FB",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {SITE.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 60,
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {SITE.fullName}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            color: "#CFE3F0",
          }}
        >
          {SITE.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
