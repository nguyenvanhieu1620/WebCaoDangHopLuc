import type { Metadata } from "next";
import { GalleryItemFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm ảnh – Đời sống trải nghiệm" };

export default function NewPage() {
  return <GalleryItemFormPage />;
}
