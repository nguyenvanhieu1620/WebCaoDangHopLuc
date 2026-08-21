import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Cổng LMS VNPT" };

export default function LmsPage() {
  return (
    <PageStub
      eyebrow="Học trực tuyến"
      title="Cổng LMS VNPT"
      description="Hướng dẫn đăng nhập và truy cập hệ thống học trực tuyến LMS VNPT dành cho sinh viên, giảng viên."
    />
  );
}
