import type { Metadata } from "next";
import { DepartmentFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa khoa/bộ môn" };

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DepartmentFormPage id={id} />;
}
