import type { Metadata } from "next";
import { QuickContactFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm nút liên hệ" };

export default function NewPage() {
  return <QuickContactFormPage />;
}
