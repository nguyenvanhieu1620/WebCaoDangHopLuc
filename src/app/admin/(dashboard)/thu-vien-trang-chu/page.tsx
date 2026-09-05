import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { upsertGalleryItemAction, deleteGalleryItemAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Thư viện ảnh Trang chủ" };

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("homepage");
  const { edit } = await searchParams;
  const allItems = await db.query.galleryItems.findMany({
    orderBy: asc(schema.galleryItems.sortOrder),
  });
  const editing = edit
    ? await db.query.galleryItems.findFirst({ where: eq(schema.galleryItems.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: desc(schema.mediaItems.createdAt),
  });

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
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-ink">{item.caption}</span>
                        {item.videoUrl && (
                          <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                            Video
                          </span>
                        )}
                      </div>
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
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Chú thích tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3">
                <AutoTranslateButton pairs={[{ viName: "caption", enName: "captionEn" }]} />
              </div>
              <input
                name="captionEn"
                defaultValue={editing?.captionEn ?? ""}
                placeholder="Caption (English)"
                className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </details>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh {editing ? "(để trống = giữ ảnh cũ)" : ""}
              </label>
              <ImagePicker
                fileFieldName="image"
                pickedFieldName="imageExisting"
                images={mediaImages}
                currentUrl={editing?.imageUrl}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Link video (YouTube, tuỳ chọn)
              </label>
              <input
                name="videoUrl"
                type="url"
                defaultValue={editing?.videoUrl ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="mt-1 text-[11px] text-ink-faint">
                Có link thì ảnh trên đóng vai trò ảnh bìa — khách bấm vào sẽ mở video ở tab mới.
              </p>
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
