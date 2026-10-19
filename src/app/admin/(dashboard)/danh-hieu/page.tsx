import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { paginate } from "@/lib/pagination";
import { deleteFacultyAttributeAction } from "./actions";
import { SECTIONS, attributeType } from "./form";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Học hàm / Học vị / Chức vụ" };

/** 3 loại (Học vị / Chức vụ / Học hàm) thành 3 tab `?type=`; mỗi tab 1 danh sách có phân trang. */
export default async function AdminFacultyAttributesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; saved?: string }>;
}) {
  await requirePermission("faculty");
  const sp = await searchParams;
  const type = attributeType(sp.type);
  const section = SECTIONS.find((s) => s.type === type)!;
  const [all, faculty] = await Promise.all([
    db.query.facultyAttributes.findMany({ orderBy: [asc(schema.facultyAttributes.sortOrder), asc(schema.facultyAttributes.seq)] }),
    db.query.faculty.findMany({ columns: { degree: true, academicRank: true, role: true } }),
  ]);
  const items = all.filter((a) => a.type === type);
  const usage = (name: string) =>
    faculty.filter((f) => (type === "degree" ? f.degree : type === "academic_rank" ? f.academicRank : f.role) === name).length;
  const pg = paginate(items, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Học hàm / Học vị / Chức vụ"
        description="Danh sách dùng chung khi tạo Giảng viên — chọn qua ô thả xuống, tránh gõ tay không đồng nhất"
        actions={<AdminNewButton href={`/admin/danh-hieu/them-moi?type=${type}`} />}
      />
      <div className="space-y-5 p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <nav aria-label="Loại danh hiệu" className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.type}
              href={`/admin/danh-hieu?type=${s.type}`}
              aria-current={s.type === type ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                s.type === type ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700"
              )}
            >
              {s.title} ({all.filter((a) => a.type === s.type).length})
            </Link>
          ))}
        </nav>
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">
            {section.title} ({items.length})
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có mục nào.{" "}
              <Link href={`/admin/danh-hieu/them-moi?type=${type}`} className="font-semibold text-brand-700 hover:underline">
                Thêm {section.title.toLowerCase()} đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-faint">#{item.sortOrder}</span>
                    <Link href={`/admin/danh-hieu/${item.id}`} className="text-sm font-medium text-ink hover:text-brand-700">
                      {item.name}
                    </Link>
                    {item.nameEn && <span className="text-[12px] text-ink-faint">{item.nameEn}</span>}
                    <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[11px] font-semibold text-ink-faint">{usage(item.name)} giảng viên</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/danh-hieu/${item.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteFacultyAttributeAction(item.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá "${item.name}"? Giảng viên đang dùng giá trị này sẽ không tự đổi.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/danh-hieu" params={{ type }} unit="mục" />
        </div>
      </div>
    </div>
  );
}
