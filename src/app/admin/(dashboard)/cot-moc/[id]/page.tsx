import type { Metadata } from "next";
import { MilestoneFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa cột mốc" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MilestoneFormPage id={id} />;
}
