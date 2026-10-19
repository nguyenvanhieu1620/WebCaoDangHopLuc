import type { Metadata } from "next";
import { HeroBannerFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm banner" };

export default function NewPage() {
  return <HeroBannerFormPage />;
}
