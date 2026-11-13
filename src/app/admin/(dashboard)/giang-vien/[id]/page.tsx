import type { Metadata } from "next";
import { FacultyFormPage } from "../form";
import type { FacultyListParams } from "../list-query";

export const metadata: Metadata = { title: "Sửa giảng viên" };

export default async function EditPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FacultyListParams>;
}) {
  const [{ id }, listParams] = await Promise.all([params, searchParams]);
  return <FacultyFormPage id={id} listParams={listParams} />;
}
