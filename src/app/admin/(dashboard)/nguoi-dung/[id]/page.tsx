import type { Metadata } from "next";
import { AdminUserFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa tài khoản" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserFormPage id={id} />;
}
