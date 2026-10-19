import type { Metadata } from "next";
import { FacultyAttributeFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa học hàm/học vị/chức vụ" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacultyAttributeFormPage id={id} />;
}
