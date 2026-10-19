import type { Metadata } from "next";
import { PostFormPage } from "../form";

export const metadata: Metadata = { title: "Viết bài mới" };

export default function NewPage() {
  return <PostFormPage />;
}
