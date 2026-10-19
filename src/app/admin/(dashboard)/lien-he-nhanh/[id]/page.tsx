import type { Metadata } from "next";
import { QuickContactFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa nút liên hệ" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuickContactFormPage id={id} />;
}
