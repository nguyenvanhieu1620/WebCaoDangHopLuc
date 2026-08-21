import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Thư viện ảnh & video" };

export default function GalleryPage() {
  return (
    <PageStub
      eyebrow="Thư viện"
      title="Thư viện ảnh & video"
      description="Hình ảnh, video hoạt động đào tạo và đời sống sinh viên tại trường."
    />
  );
}
