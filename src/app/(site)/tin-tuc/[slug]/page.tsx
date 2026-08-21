import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";

export const metadata: Metadata = { title: "Chi tiết bài viết" };

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageStub
      eyebrow="Tin tức"
      title="Chi tiết bài viết"
      description={`Slug: ${slug} — nội dung bài viết đầy đủ sẽ hiển thị tại đây.`}
    />
  );
}
