import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { formatVNDateTime } from "@/lib/utils";
import { paginate } from "@/lib/pagination";
import { deleteEventAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Sự kiện" };

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("events");
  const sp = await searchParams;
  const allEvents = await db.query.events.findMany({ orderBy: [desc(schema.events.startAt), desc(schema.events.seq)] });
  const pg = paginate(allEvents, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Sự kiện"
        description="Lịch sự kiện hiển thị ở /su-kien — khác Tin tức"
        actions={<AdminNewButton href="/admin/su-kien/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allEvents.length})</div>
          {allEvents.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có sự kiện nào.{" "}
              <Link href="/admin/su-kien/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm sự kiện đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <Link href={`/admin/su-kien/${e.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                      {e.title}
                    </Link>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      {formatVNDateTime(e.startAt)}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/su-kien/${e.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteEventAction(e.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá sự kiện "${e.title}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/su-kien" unit="sự kiện" />
        </div>
      </div>
    </div>
  );
}
