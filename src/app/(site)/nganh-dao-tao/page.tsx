import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Ngành đào tạo" };

export default function ProgramsPage() {
  return (
    <PageStub
      eyebrow="Ngành đào tạo"
      title="6 ngành khối sức khỏe giàu cơ hội"
      description="Danh sách đầy đủ các ngành đào tạo chính quy, chương trình học và cơ hội nghề nghiệp."
    />
  );
}
