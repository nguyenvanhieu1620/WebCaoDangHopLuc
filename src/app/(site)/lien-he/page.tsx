import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Liên hệ" };

export default function ContactPage() {
  return (
    <PageStub
      eyebrow="Liên hệ"
      title="Liên hệ với Hợp Lực"
      description="Thông tin liên hệ, bản đồ và form gửi câu hỏi tới nhà trường."
    />
  );
}
