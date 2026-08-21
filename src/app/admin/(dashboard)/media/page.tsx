import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const metadata: Metadata = { title: "Thư viện media" };

export default function AdminMediaPage() {
  return (
    <div>
      <AdminTopbar title="Thư viện media" description="Quản lý ảnh & video dùng trên website" />
      <div className="p-8">
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
          Lưới ảnh/video + khu vực upload sẽ được dựng ở bước tiếp theo.
        </div>
      </div>
    </div>
  );
}
