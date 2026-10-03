import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertDepartmentAction, deleteDepartmentAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Khoa / Bộ môn" };

export default async function AdminDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("faculty");
  const { edit } = await searchParams;
  const [allDepartments, allFaculty] = await Promise.all([
    db.query.departments.findMany({ orderBy: asc(schema.departments.sortOrder) }),
    db.query.faculty.findMany(),
  ]);
  const editing = edit
    ? await db.query.departments.findFirst({ where: eq(schema.departments.id, edit) })
    : null;
  const facultyCountByDept = new Map<string, number>();
  for (const f of allFaculty) {
    if (f.departmentId) {
      facultyCountByDept.set(f.departmentId, (facultyCountByDept.get(f.departmentId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <AdminTopbar
        title="Khoa / Bộ môn"
        description="Danh mục nhóm giảng viên theo khoa — hiện ở trang /doi-ngu-giang-vien"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allDepartments.length})
            </span>
          </div>
          {allDepartments.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có khoa/bộ môn nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allDepartments.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-faint">#{d.sortOrder}</span>
                    <span className="text-sm font-medium text-ink">{d.name}</span>
                    <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                      {facultyCountByDept.get(d.id) ?? 0} giảng viên
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/khoa?edit=${d.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
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
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.name}` : "Thêm khoa/bộ môn"}
            </span>
            {editing && (
              <a href="/admin/khoa" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertDepartmentAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên khoa/bộ môn</label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Khoa Điều dưỡng"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Tên tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3">
                <AutoTranslateButton pairs={[{ viName: "name", enName: "nameEn" }]} />
                <input
                  name="nameEn"
                  defaultValue={editing?.nameEn ?? ""}
                  placeholder="Department name (English)"
                  className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </details>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Vị trí (số nhỏ hiện trước)
              </label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allDepartments.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm khoa/bộ môn"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
