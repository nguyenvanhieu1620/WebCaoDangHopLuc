import type { Metadata } from "next";
import { MilestoneFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm cột mốc" };

export default function NewPage() {
  return <MilestoneFormPage />;
}
