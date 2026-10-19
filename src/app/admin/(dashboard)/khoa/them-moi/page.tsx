import type { Metadata } from "next";
import { DepartmentFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm khoa/bộ môn" };

export default function NewDepartmentPage() {
  return <DepartmentFormPage />;
}
