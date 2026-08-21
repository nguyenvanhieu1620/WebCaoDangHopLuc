import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertGalleryItemAction, deleteGalleryItemAction } from "./actions";

export const metadata: Metadata = { title: "Thư viện ảnh Trang chủ" };

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const allItems = await db.query.galleryItems.findMany({
    orderBy: asc(schema.galleryItems.sortOrder),
  });
  const editing = edit
    ? await db.query.galleryItems.findFirst({ where: eq(schema.galleryItems.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Thư viện ảnh Trang chủ"
        description="Khối ảnh 'Đời sống sinh viên' dạng bento ở Trang chủ"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allItems.length})
            </span>
          </div>
          {allItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có ảnh nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-alt">
                      <Image src={item.imageUrl} alt={item.caption} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{item.caption}</div>
                      <div className="text-[11.5px] text-ink-faint">vị trí #{item.sortOrder}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/thu-vien-trang-chu?edit=${item.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deleteGalleryItemAction(item.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                      >
                        Xoá
                      </button>
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
              {editing ? `Sửa: ${editing.caption}` : "Thêm ảnh"}
            </span>
            {editing && (
              <a
                href="/admin/thu-vien-trang-chu"
                className="text-xs font-semibold text-ink-faint hover:text-ink"
              >
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertGalleryItemAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Chú thích</label>
              <input
                name="caption"
                required
                defaultValue={editing?.caption}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Thực hành lâm sàng"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh {editing ? "(để trống = giữ ảnh cũ)" : ""}
              </label>
              {editing?.imageUrl && (
                <Image
                  src={editing.imageUrl}
                  alt={editing.caption}
                  width={160}
                  height={100}
                  className="mb-2 h-24 w-auto rounded-lg border border-line object-cover"
                />
              )}
              <input
                type="file"
                name="image"
                accept="image/*"
                required={!editing}
                className="w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allItems.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm ảnh"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
