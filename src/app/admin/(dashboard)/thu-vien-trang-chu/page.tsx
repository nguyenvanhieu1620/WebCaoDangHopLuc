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
import { deleteGalleryItemAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đời sống trải nghiệm" };

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("homepage");
  const sp = await searchParams;
  const allItems = await db.query.galleryItems.findMany({
    orderBy: [asc(schema.galleryItems.sortOrder), asc(schema.galleryItems.seq)],
  });
  const pg = paginate(allItems, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Đời sống trải nghiệm"
        description="Ảnh/video khối 'Đời sống sinh viên – Trải nghiệm Hợp Lực' ở Trang chủ (5 mục đầu) và trang /thu-vien (tất cả)"
        actions={<AdminNewButton href="/admin/thu-vien-trang-chu/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allItems.length})</div>
          {allItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có ảnh nào.{" "}
              <Link href="/admin/thu-vien-trang-chu/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm ảnh đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-alt">
                      <Image src={item.imageUrl} alt={item.caption} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/thu-vien-trang-chu/${item.id}`} className="truncate text-sm font-medium text-ink hover:text-brand-700">
                          {item.caption}
                        </Link>
                        {item.videoUrl && (
                          <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">Video</span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-ink-faint">vị trí #{item.sortOrder}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/thu-vien-trang-chu/${item.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteGalleryItemAction(item.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá ảnh "${item.caption}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/thu-vien-trang-chu" unit="ảnh" />
        </div>
      </div>
    </div>
  );
}
