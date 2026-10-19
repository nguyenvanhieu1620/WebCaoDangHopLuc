import type { Metadata } from "next";
import { CategoryFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa danh mục" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryFormPage id={id} />;
}
