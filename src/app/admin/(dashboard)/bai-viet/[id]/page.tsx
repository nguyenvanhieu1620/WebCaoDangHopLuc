import type { Metadata } from "next";
import { PostFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa bài viết" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostFormPage id={id} />;
}
