import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Tuyển sinh" };

export default function AdmissionsPage() {
  return (
    <PageStub
      eyebrow="Tuyển sinh 2026"
      title="Chỉ tiêu, điều kiện & đăng ký xét tuyển"
      description="Thông tin chỉ tiêu, học phí theo ngành và form đăng ký xét tuyển trực tuyến."
    />
  );
}
