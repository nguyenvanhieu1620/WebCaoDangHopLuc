import type { Metadata } from "next";
import { AdmissionItemFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm mục tuyển sinh" };

export default async function NewPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return <AdmissionItemFormPage type={type} />;
}
