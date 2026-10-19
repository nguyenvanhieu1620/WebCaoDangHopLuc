import type { Metadata } from "next";
import { FacultyAttributeFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm học hàm/học vị/chức vụ" };

export default async function NewPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return <FacultyAttributeFormPage type={type} />;
}
