import type { Metadata } from "next";
import { AdmissionItemFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa mục tuyển sinh" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdmissionItemFormPage id={id} />;
}
