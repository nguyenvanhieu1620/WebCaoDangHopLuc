import type { Metadata } from "next";
import { AdminUserFormPage } from "../form";

export const metadata: Metadata = { title: "Thêm tài khoản" };

export default function NewPage() {
  return <AdminUserFormPage />;
}
