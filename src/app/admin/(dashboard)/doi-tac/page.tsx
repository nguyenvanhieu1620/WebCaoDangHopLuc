import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deletePartnerAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đối tác" };

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("partners");
  const sp = await searchParams;
  const allPartners = await db.query.partners.findMany({
    orderBy: [asc(schema.partners.sortOrder), asc(schema.partners.seq)],
  });
  const pg = paginate(allPartners, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Đối tác"
        description="Dải logo/tên đối tác chạy ngang ở Trang chủ — vị trí càng nhỏ hiện càng trước"
        actions={<AdminNewButton href="/admin/doi-tac/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allPartners.length})</div>
          {allPartners.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có đối tác nào.{" "}
              <Link href="/admin/doi-tac/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm đối tác đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-faint">#{p.sortOrder}</span>
                    {p.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- logo nhỏ trong admin, không cần tối ưu
                      <img src={p.logoUrl} alt="" className="h-7 w-auto max-w-[80px] object-contain" />
                    )}
                    <Link href={`/admin/doi-tac/${p.id}`} className="truncate text-sm font-medium text-ink hover:text-brand-700">
                      {p.name}
                    </Link>
                    {p.websiteUrl && <span className="hidden truncate font-mono text-[10.5px] text-ink-faint sm:inline">{p.websiteUrl.replace(/^https?:\/\//, "")}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/doi-tac/${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deletePartnerAction(p.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá đối tác "${p.name}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/doi-tac" unit="đối tác" />
        </div>
      </div>
    </div>
  );
}
