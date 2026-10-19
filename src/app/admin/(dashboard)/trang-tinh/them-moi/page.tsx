import type { Metadata } from "next";
import { StaticPageFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm trang tĩnh" };

export default function NewPage() {
  return <StaticPageFormPage />;
}
