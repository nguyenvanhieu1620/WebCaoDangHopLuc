import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { upsertTestimonialAction, deleteTestimonialAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đánh giá cựu sinh viên" };

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("testimonials");
  const { edit } = await searchParams;
  const allTestimonials = await db.query.testimonials.findMany({
    orderBy: [asc(schema.testimonials.sortOrder), asc(schema.testimonials.seq)],
  });
  const editing = edit
    ? await db.query.testimonials.findFirst({ where: eq(schema.testimonials.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });

  return (
    <div>
      <AdminTopbar
        title="Đánh giá cựu sinh viên"
        description="Trích dẫn cảm nhận hiển thị ở Trang chủ"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allTestimonials.length})
            </span>
          </div>
          {allTestimonials.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có đánh giá nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allTestimonials.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-paper-alt">
                      {t.avatarUrl && (
                        <Image src={t.avatarUrl} alt={t.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{t.name}</div>
                      <div className="truncate text-[11.5px] text-ink-faint">
                        {t.role} · vị trí #{t.sortOrder}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/danh-gia?edit=${t.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
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
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.name}` : "Thêm đánh giá"}
            </span>
            {editing && (
              <a href="/admin/danh-gia" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertTestimonialAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Trích dẫn</label>
              <textarea
                name="quote"
                required
                rows={3}
                defaultValue={editing?.quote}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Cảm nhận của cựu sinh viên..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Họ tên</label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Vai trò hiện tại</label>
              <input
                name="role"
                required
                defaultValue={editing?.role}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Điều dưỡng viên, BV Đa khoa tỉnh"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "quote", enName: "quoteEn" },
                    { viName: "role", enName: "roleEn" },
                  ]}
                />
                <textarea
                  name="quoteEn"
                  rows={3}
                  defaultValue={editing?.quoteEn ?? ""}
                  placeholder="Quote (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <input
                  name="roleEn"
                  defaultValue={editing?.roleEn ?? ""}
                  placeholder="Role (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </details>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh đại diện {editing ? "(để trống = giữ ảnh cũ)" : ""}
              </label>
              <ImagePicker
                spec="avatar"
                fileFieldName="avatar"
                pickedFieldName="avatarExisting"
                images={mediaImages}
                currentUrl={editing?.avatarUrl}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allTestimonials.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm đánh giá"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
