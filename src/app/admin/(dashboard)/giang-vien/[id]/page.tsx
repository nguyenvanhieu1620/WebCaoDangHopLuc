import type { Metadata } from "next";
import { FacultyFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa giảng viên" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacultyFormPage id={id} />;
}
