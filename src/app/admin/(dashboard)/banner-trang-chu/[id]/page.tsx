import type { Metadata } from "next";
import { HeroBannerFormPage } from "../form";

export const metadata: Metadata = { title: "Sửa banner" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HeroBannerFormPage id={id} />;
}
