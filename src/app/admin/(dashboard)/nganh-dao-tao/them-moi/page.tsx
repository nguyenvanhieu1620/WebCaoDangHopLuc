import type { Metadata } from "next";
import { ProgramFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm ngành đào tạo" };

export default function NewPage() {
  return <ProgramFormPage />;
}
