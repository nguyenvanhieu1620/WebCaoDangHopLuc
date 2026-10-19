import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { facultyDisplayName } from "@/lib/data/faculty";
import { paginate } from "@/lib/pagination";
import { deleteFacultyAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

export default async function AdminFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("faculty");
  const sp = await searchParams;
  const [allFaculty, departments] = await Promise.all([
    db.query.faculty.findMany({ orderBy: [asc(schema.faculty.sortOrder), asc(schema.faculty.seq)] }),
    db.query.departments.findMany({ columns: { id: true, name: true } }),
  ]);
  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));
  const pg = paginate(allFaculty, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Đội ngũ giảng viên"
        description="Thẻ giảng viên hiển thị ở Trang chủ và /doi-ngu-giang-vien — quản lý Khoa/Bộ môn riêng ở mục Khoa / Bộ môn"
        actions={<AdminNewButton href="/admin/giang-vien/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allFaculty.length})</div>
          {allFaculty.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có giảng viên nào.{" "}
              <Link href="/admin/giang-vien/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm giảng viên đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-paper-alt">
                      {f.photoUrl && <Image src={f.photoUrl} alt={f.name} fill sizes="40px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/giang-vien/${f.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                        {facultyDisplayName(f)}
                      </Link>
                      <div className="truncate text-[11.5px] text-ink-faint">
                        {f.role}
                        {f.departmentId && departmentNameById.get(f.departmentId) ? ` · ${departmentNameById.get(f.departmentId)}` : ""} · vị trí #
                        {f.sortOrder}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/giang-vien/${f.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteFacultyAction(f.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá giảng viên "${f.name}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/giang-vien" unit="giảng viên" />
        </div>
      </div>
    </div>
  );
}
