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
import { normalizeSearch } from "@/lib/utils";
import { deleteFacultyAction } from "./actions";
import { facultyListSearch, type FacultyListParams } from "./list-query";
import { ClearSavedFacultyDraft } from "./save-form";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

const NO_DEPARTMENT = "unassigned";
const filterField = "min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink outline-none focus:border-brand-500";

export default async function AdminFacultyPage({
  searchParams,
}: {
  searchParams: Promise<FacultyListParams & { saved?: string | string[]; draft?: string | string[] }>;
}) {
  const user = await requirePermission("faculty");
  const sp = await searchParams;
  const [allFaculty, departments] = await Promise.all([
    db.query.faculty.findMany({ orderBy: [asc(schema.faculty.sortOrder), asc(schema.faculty.seq)] }),
    db.query.departments.findMany({
      columns: { id: true, name: true },
      orderBy: [asc(schema.departments.sortOrder), asc(schema.departments.seq)],
    }),
  ]);
  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const requestedDepartment = (Array.isArray(sp.department) ? sp.department[0] : sp.department) ?? "";
  const department = requestedDepartment === NO_DEPARTMENT || departmentNameById.has(requestedDepartment)
    ? requestedDepartment
    : "";
  const nameQuery = normalizeSearch(q);
  const filteredFaculty = allFaculty.filter((faculty) => {
    const assignedDepartment = faculty.departmentId ?? "";
    if (department === NO_DEPARTMENT && departmentNameById.has(assignedDepartment)) return false;
    if (department && department !== NO_DEPARTMENT && assignedDepartment !== department) return false;
    return !nameQuery || normalizeSearch(facultyDisplayName(faculty)).includes(nameQuery);
  });
  const pg = paginate(filteredFaculty, sp.page);
  const hasFilters = Boolean(q || department);
  const listSearch = facultyListSearch({ q, department, page: pg.page > 1 ? String(pg.page) : undefined });

  return (
    <div>
      <AdminTopbar
        title="Đội ngũ giảng viên"
        description="Thẻ giảng viên hiển thị ở Trang chủ và /doi-ngu-giang-vien — quản lý Khoa/Bộ môn riêng ở mục Khoa / Bộ môn"
        actions={<AdminNewButton href="/admin/giang-vien/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <ClearSavedFacultyDraft userId={user.id} token={sp.saved === "1" ? sp.draft : undefined} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="space-y-3 border-b border-line px-4 py-4 sm:px-6">
            <div className="text-sm font-semibold text-brand-900">
              Danh sách ({hasFilters ? `${filteredFaculty.length}/${allFaculty.length}` : allFaculty.length})
            </div>
            <form role="search" action="/admin/giang-vien" method="get" className="flex flex-wrap items-end gap-3">
              <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft sm:w-auto sm:flex-1 sm:basis-44">
                Tìm theo tên
                <input key={q} type="search" name="q" defaultValue={q} placeholder="Nhập họ tên giảng viên" className={filterField} />
              </label>
              <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft sm:w-auto sm:flex-1 sm:basis-44">
                Khoa / Bộ môn
                <select key={department} name="department" defaultValue={department} className={filterField}>
                  <option value="">Tất cả khoa / bộ môn</option>
                  <option value={NO_DEPARTMENT}>Chưa gán khoa / bộ môn</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <button type="submit" className="min-h-11 rounded-lg bg-brand-700 px-4 text-xs font-semibold text-white hover:bg-brand-800">
                Tìm giảng viên
              </button>
              {hasFilters && (
                <Link href="/admin/giang-vien" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-brand-700 underline">
                  Xóa bộ lọc
                </Link>
              )}
            </form>
          </div>
          {filteredFaculty.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              {allFaculty.length > 0 ? "Không tìm thấy giảng viên phù hợp." : (
                <>
                  Chưa có giảng viên nào.{" "}
                  <Link href="/admin/giang-vien/them-moi" className="font-semibold text-brand-700 hover:underline">
                    Thêm giảng viên đầu tiên
                  </Link>
                </>
              )}
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
                      <Link href={`/admin/giang-vien/${f.id}${listSearch}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
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
                      href={`/admin/giang-vien/${f.id}${listSearch}`}
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
          <AdminPagination
            pagination={pg}
            basePath="/admin/giang-vien"
            params={{ q, department }}
            unit="giảng viên"
          />
        </div>
      </div>
    </div>
  );
}
