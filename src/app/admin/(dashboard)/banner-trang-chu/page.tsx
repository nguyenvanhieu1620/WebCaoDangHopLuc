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
import { deleteHeroBannerAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Banner Trang chủ" };

export default async function AdminHeroBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("homepage");
  const sp = await searchParams;
  const allBanners = await db.query.heroBanners.findMany({
    orderBy: [asc(schema.heroBanners.sortOrder), asc(schema.heroBanners.seq)],
  });
  const pg = paginate(allBanners, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Banner Trang chủ"
        description="Ảnh banner rộng hết màn hình ở đầu Trang chủ, hiện rõ nguyên ảnh (không phủ màu, không chữ đè), tự chuyển 6,5 giây/ảnh — chưa có ảnh nào thì dùng ảnh Hero cũ hoặc ảnh minh hoạ tạm"
        actions={<AdminNewButton href="/admin/banner-trang-chu/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allBanners.length})</div>
          {allBanners.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có banner nào — Trang chủ đang hiện ảnh Hero tĩnh cũ.{" "}
              <Link href="/admin/banner-trang-chu/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm banner đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-paper-alt">
                      <Image src={b.imageUrl} alt={b.caption ?? "Banner"} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/banner-trang-chu/${b.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                        {b.caption || "(không có chú thích)"}
                      </Link>
                      <div className="text-[11.5px] text-ink-faint">
                        vị trí #{b.sortOrder}
                        {b.videoUrl && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">🎬 Có video</span>}
                        {b.linkUrl && <span className="ml-2 font-mono">→ {b.linkUrl}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/banner-trang-chu/${b.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteHeroBannerAction(b.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage="Xoá banner này? Không thể hoàn tác."
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/banner-trang-chu" unit="banner" />
        </div>
      </div>
    </div>
  );
}
