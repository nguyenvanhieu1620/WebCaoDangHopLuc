import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deleteDepartmentAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Khoa / Bộ môn" };

export default async function AdminDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("faculty");
  const sp = await searchParams;
  const [allDepartments, allFaculty] = await Promise.all([
    db.query.departments.findMany({ orderBy: [asc(schema.departments.sortOrder), asc(schema.departments.seq)] }),
    db.query.faculty.findMany(),
  ]);
  const facultyCountByDept = new Map<string, number>();
  for (const f of allFaculty) {
    if (f.departmentId) {
      facultyCountByDept.set(f.departmentId, (facultyCountByDept.get(f.departmentId) ?? 0) + 1);
    }
  }
  const pg = paginate(allDepartments, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Khoa / Bộ môn"
        description="Danh mục nhóm giảng viên theo khoa — hiện ở trang /doi-ngu-giang-vien"
        actions={<AdminNewButton href="/admin/khoa/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">Danh sách ({allDepartments.length})</span>
          </div>
          {allDepartments.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có khoa/bộ môn nào.{" "}
              <Link href="/admin/khoa/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm khoa/bộ môn đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-faint">#{d.sortOrder}</span>
                    <Link href={`/admin/khoa/${d.id}`} className="text-sm font-medium text-ink hover:text-brand-700">
                      {d.name}
                    </Link>
                    <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                      {facultyCountByDept.get(d.id) ?? 0} giảng viên
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/khoa/${d.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteDepartmentAction(d.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá khoa "${d.name}"? Giảng viên thuộc khoa này sẽ không còn khoa (không bị xoá).`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/khoa" unit="khoa/bộ môn" />
        </div>
      </div>
    </div>
  );
}
