import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deleteProgramAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Quản lý ngành đào tạo" };

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("programs");
  const sp = await searchParams;
  const allPrograms = await db.query.programs.findMany({
    orderBy: [asc(schema.programs.createdAt), asc(schema.programs.seq)],
  });
  const pg = paginate(allPrograms, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Ngành đào tạo"
        description="Quản lý danh sách ngành đào tạo hiển thị ở Trang chủ & /nganh-dao-tao"
        actions={<AdminNewButton href="/admin/nganh-dao-tao/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allPrograms.length})</div>
          {allPrograms.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có ngành đào tạo nào.{" "}
              <Link href="/admin/nganh-dao-tao/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm ngành đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong admin, không cần tối ưu
                      <img src={p.imageUrl} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-ink-faint">
                        Chưa ảnh
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link href={`/admin/nganh-dao-tao/${p.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                        {p.code} — {p.name}
                      </Link>
                      <div className="mt-0.5 text-[11.5px] text-ink-faint">
                        {p.duration} · {p.intake} chỉ tiêu · {p.tuition ? `Học phí ${p.tuition}` : "Chưa nhập học phí"}
                        {p.featured === 1 && (
                          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">Hiện ở Trang chủ</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/nganh-dao-tao/${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteProgramAction(p.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá ngành "${p.name}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/nganh-dao-tao" unit="ngành" />
        </div>
      </div>
    </div>
  );
}
