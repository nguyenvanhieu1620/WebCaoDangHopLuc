import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Tra cứu kết quả xét tuyển" };

export default function AdmissionsLookupPage() {
  return (
    <PageStub
      eyebrow="Tra cứu kết quả"
      title="Tra cứu kết quả xét tuyển"
      description="Nhập số CCCD để tra cứu kết quả xét tuyển trực tuyến."
    />
  );
}
