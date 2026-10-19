import type { Metadata } from "next";
import { NavItemFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa mục menu" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NavItemFormPage id={id} />;
}
