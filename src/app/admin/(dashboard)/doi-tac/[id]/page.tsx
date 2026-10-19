import type { Metadata } from "next";
import { PartnerFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa đối tác" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerFormPage id={id} />;
}
