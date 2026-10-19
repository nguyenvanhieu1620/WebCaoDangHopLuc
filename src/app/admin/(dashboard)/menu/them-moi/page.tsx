import type { Metadata } from "next";
import { NavItemFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm mục menu" };

export default async function NewPage({ searchParams }: { searchParams: Promise<{ parent?: string }> }) {
  const { parent } = await searchParams;
  return <NavItemFormPage parent={parent} />;
}
