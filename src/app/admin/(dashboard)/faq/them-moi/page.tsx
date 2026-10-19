import type { Metadata } from "next";
import { FaqFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm câu hỏi" };

export default function NewPage() {
  return <FaqFormPage />;
}
