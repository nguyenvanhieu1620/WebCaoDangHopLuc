import type { Metadata } from "next";
import { GalleryItemFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa ảnh – Đời sống trải nghiệm" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GalleryItemFormPage id={id} />;
}
