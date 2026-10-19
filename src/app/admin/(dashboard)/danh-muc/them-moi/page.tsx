import type { Metadata } from "next";
import { CategoryFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm danh mục" };

export default function NewPage() {
  return <CategoryFormPage />;
}
