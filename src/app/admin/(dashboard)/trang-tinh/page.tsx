import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deletePageAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { hasPlaceholder } from "@/lib/utils";

export const metadata: Metadata = { title: "Quản lý trang tĩnh" };

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("pages");
  const sp = await searchParams;
  const allPages = await db.query.pages.findMany({
    orderBy: [asc(schema.pages.title), asc(schema.pages.seq)],
  });
  const pg = paginate(allPages, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Trang tĩnh"
        description="Sửa nội dung các trang: Công khai, Giới thiệu, Liên hệ... — sửa xong hiện ngay trên web công khai theo đúng slug"
        actions={<AdminNewButton href="/admin/trang-tinh/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allPages.length})</div>
          {allPages.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có trang tĩnh nào (VD slug &quot;gioi-thieu&quot; cho trang Giới thiệu).{" "}
              <Link href="/admin/trang-tinh/them-moi" className="font-semibold text-brand-700 hover:underline">
                Tạo trang đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/trang-tinh/${p.id}`} className="truncate text-sm font-medium text-ink hover:text-brand-700">
                        {p.title}
                      </Link>
                      {hasPlaceholder(p.content) && (
                        <span
                          title="Nội dung còn ghi chú nội bộ [...] — trang công khai hiện thông báo chờ cập nhật. Cần nhập nội dung chính thức."
                          className="shrink-0 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700"
                        >
                          ⚠️ Chưa điền
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-faint">/{p.slug}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/trang-tinh/${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deletePageAction(p.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá trang "${p.title}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/trang-tinh" unit="trang" />
        </div>
      </div>
    </div>
  );
}
