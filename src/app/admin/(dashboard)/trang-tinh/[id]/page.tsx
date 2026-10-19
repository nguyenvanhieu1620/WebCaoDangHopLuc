import type { Metadata } from "next";
import { StaticPageFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa trang tĩnh" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaticPageFormPage id={id} />;
}
