import type { Metadata } from "next";
import { EventFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa sự kiện" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventFormPage id={id} />;
}
