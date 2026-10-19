import type { Metadata } from "next";
import { TestimonialFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa đánh giá" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestimonialFormPage id={id} />;
}
