import type { Metadata } from "next";
import { FacultyFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm giảng viên" };

export default function NewPage() {
  return <FacultyFormPage />;
}
