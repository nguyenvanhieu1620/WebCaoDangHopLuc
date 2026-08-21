import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  return (
    <PageStub
      eyebrow="Giới thiệu"
      title="Về Trường Cao đẳng Y Dược Hợp Lực"
      description="Sứ mệnh, lịch sử hình thành, cơ sở vật chất và đội ngũ lãnh đạo nhà trường."
    />
  );
}
