import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Tin tức & sự kiện" };

export default function NewsPage() {
  return (
    <PageStub
      eyebrow="Tin tức & sự kiện"
      title="Hoạt động đào tạo, tuyển sinh mới nhất"
      description="Danh sách bài viết tin tức, thông báo và sự kiện của nhà trường."
    />
  );
}
