import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { upsertHeroBannerAction, deleteHeroBannerAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Banner Trang chủ" };

export default async function AdminHeroBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("homepage");
  const { edit } = await searchParams;
  const allBanners = await db.query.heroBanners.findMany({
    orderBy: asc(schema.heroBanners.sortOrder),
  });
  const editing = edit
    ? await db.query.heroBanners.findFirst({ where: eq(schema.heroBanners.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: desc(schema.mediaItems.createdAt),
  });

  return (
    <div>
      <AdminTopbar
        title="Banner Trang chủ"
        description="Ảnh banner tràn toàn màn hình ở đầu Trang chủ, tự chuyển 6,5 giây/ảnh — chưa có ảnh nào thì dùng ảnh Hero cũ hoặc ảnh minh hoạ tạm"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allBanners.length})
            </span>
          </div>
          {allBanners.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có banner nào. Thêm ở form bên phải — Trang chủ đang hiện ảnh Hero
              tĩnh cũ.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allBanners.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-paper-alt">
                      <Image src={b.imageUrl} alt={b.caption ?? "Banner"} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {b.caption || "(không có chú thích)"}
                      </div>
                      <div className="text-[11.5px] text-ink-faint">vị trí #{b.sortOrder}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/banner-trang-chu?edit=${b.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
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
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? "Sửa banner" : "Thêm banner"}
            </span>
            {editing && (
              <a
                href="/admin/banner-trang-chu"
                className="text-xs font-semibold text-ink-faint hover:text-ink"
              >
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertHeroBannerAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
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
              <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-brand-800">
                <strong>Banner phủ kín toàn màn hình</strong> — nên dùng ảnh ngang, tối thiểu <strong>1920×1080</strong> (tỉ lệ 16:9), dung lượng
                dưới ~1MB. Chữ tiêu đề nằm bên trái trên lớp phủ xanh đậm, nên chọn ảnh có <strong>chủ thể lệch sang phải</strong> (sinh viên,
                giảng viên, phòng thực hành…) để không bị chữ che.
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Chú thích (tuỳ chọn)
              </label>
              <input
                name="caption"
                defaultValue={editing?.caption ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Sinh viên thực hành lâm sàng"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Chú thích tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3">
                <AutoTranslateButton pairs={[{ viName: "caption", enName: "captionEn" }]} />
                <input
                  name="captionEn"
                  defaultValue={editing?.captionEn ?? ""}
                  placeholder="Caption (English)"
                  className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </details>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Bấm vào banner đi tới đâu (tuỳ chọn)
              </label>
              <input
                name="linkUrl"
                defaultValue={editing?.linkUrl ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: /tuyen-sinh"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Vị trí (số nhỏ hiện trước)
              </label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allBanners.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm banner"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
