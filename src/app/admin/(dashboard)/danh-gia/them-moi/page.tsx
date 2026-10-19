import type { Metadata } from "next";
import { TestimonialFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm đánh giá" };

export default function NewPage() {
  return <TestimonialFormPage />;
}
