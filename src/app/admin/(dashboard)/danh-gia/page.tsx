import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deleteTestimonialAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đánh giá cựu sinh viên" };

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("homepage");
  const sp = await searchParams;
  const allTestimonials = await db.query.testimonials.findMany({
    orderBy: [asc(schema.testimonials.sortOrder), asc(schema.testimonials.seq)],
  });
  const pg = paginate(allTestimonials, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Đánh giá cựu sinh viên"
        description="Trích dẫn cảm nhận hiển thị ở Trang chủ"
        actions={<AdminNewButton href="/admin/danh-gia/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allTestimonials.length})</div>
          {allTestimonials.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có đánh giá nào.{" "}
              <Link href="/admin/danh-gia/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm đánh giá đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-paper-alt">
                      {t.avatarUrl && <Image src={t.avatarUrl} alt={t.name} fill sizes="40px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/danh-gia/${t.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                        {t.name}
                      </Link>
                      <div className="truncate text-[11.5px] text-ink-faint">
                        {t.role} · vị trí #{t.sortOrder}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/danh-gia/${t.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteTestimonialAction(t.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá đánh giá của "${t.name}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/danh-gia" unit="đánh giá" />
        </div>
      </div>
    </div>
  );
}
