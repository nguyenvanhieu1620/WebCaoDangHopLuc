import type { Metadata } from "next";
import { FaqFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa câu hỏi" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FaqFormPage id={id} />;
}
