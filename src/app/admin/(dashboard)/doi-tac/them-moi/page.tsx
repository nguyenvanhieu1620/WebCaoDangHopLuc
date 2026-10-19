import type { Metadata } from "next";
import { PartnerFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm đối tác" };

export default function NewPage() {
  return <PartnerFormPage />;
}
