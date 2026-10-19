import type { Metadata } from "next";
import { ProgramFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa ngành đào tạo" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgramFormPage id={id} />;
}
