import type { Metadata } from "next";
import { EventFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm sự kiện" };

export default function NewPage() {
  return <EventFormPage />;
}
