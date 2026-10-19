import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc, desc } from "drizzle-orm";
import { hasPlaceholder } from "@/lib/utils";
import { paginate } from "@/lib/pagination";
import { deleteMilestoneAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Cột mốc" };

/**
 * Cột mốc phát triển — dòng thời gian ở /gioi-thieu (chọn năm → hiện các mốc).
 * Cùng quyền với Trang tĩnh (module `pages`). Chưa có mốc nào thì khối dòng thời
 * gian trên web tự ẩn. Danh sách phân trang theo mốc, trong 1 trang vẫn nhóm theo năm.
 */
export default async function AdminMilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("pages");
  const sp = await searchParams;
  const all = await db.query.milestones.findMany({
    orderBy: [desc(schema.milestones.year), asc(schema.milestones.sortOrder), asc(schema.milestones.createdAt), asc(schema.milestones.seq)],
  });
  const totalYears = new Set(all.map((m) => m.year)).size;
  const pg = paginate(all, sp.page);
  const years = [...new Set(pg.items.map((m) => m.year))];

  return (
    <div>
      <AdminTopbar
        title="Cột mốc phát triển"
        description="Dòng thời gian ở trang Giới thiệu — web hiện theo năm, trong năm theo vị trí (số nhỏ hiện trước)"
        actions={<AdminNewButton href="/admin/cot-moc/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              {all.length} mốc · {totalYears} năm
            </span>
            <a href="/gioi-thieu#cot-moc" target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">
              Xem trên web ↗
            </a>
          </div>
          {all.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có cột mốc nào — trang Giới thiệu sẽ tự hiện khối &quot;Những cột mốc&quot; khi có ít nhất 1 mốc.{" "}
              <Link href="/admin/cot-moc/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm cột mốc đầu tiên
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {years.map((year) => (
                <div key={year} className="px-6 py-4">
                  <div className="mb-2 font-display text-[20px] font-bold text-brand-900">{year}</div>
                  <ul className="space-y-2">
                    {pg.items
                      .filter((m) => m.year === year)
                      .map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {m.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong admin, không cần tối ưu
                              <img src={m.imageUrl} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                                <span className="font-mono text-[11px] text-ink-faint">#{m.sortOrder}</span>
                                {m.period && <span className="font-mono text-[11px] text-accent-600">{m.period}</span>}
                                <Link href={`/admin/cot-moc/${m.id}`} className="truncate hover:text-brand-700">
                                  {m.title}
                                </Link>
                                {(hasPlaceholder(m.title) || hasPlaceholder(m.description)) && (
                                  <span className="shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-[10.5px] font-semibold text-accent-700">⚠️ Chưa điền</span>
                                )}
                              </div>
                              {m.description && <div className="mt-0.5 truncate text-[12px] text-ink-faint">{m.description}</div>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Link
                              href={`/admin/cot-moc/${m.id}`}
                              className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                            >
                              Sửa
                            </Link>
                            <form
                              action={async () => {
                                "use server";
                                await deleteMilestoneAction(m.id);
                              }}
                            >
                              <ConfirmDeleteButton
                                className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                                confirmMessage={`Xoá cột mốc "${m.title}"? Không thể hoàn tác.`}
                              >
                                Xoá
                              </ConfirmDeleteButton>
                            </form>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <AdminPagination pagination={pg} basePath="/admin/cot-moc" unit="mốc" />
        </div>
      </div>
    </div>
  );
}
