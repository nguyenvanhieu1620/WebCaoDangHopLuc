import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { formatVNDateTime } from "@/lib/utils";
import { upsertEventAction, deleteEventAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Sự kiện" };

/** "2026-09-15T09:00:00.000Z" -> "2026-09-15T09:00" (giờ local, cho input datetime-local). */
function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("events");
  const { edit } = await searchParams;
  const allEvents = await db.query.events.findMany({ orderBy: desc(schema.events.startAt) });
  const editing = edit
    ? await db.query.events.findFirst({ where: eq(schema.events.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: desc(schema.mediaItems.createdAt),
  });

  return (
    <div>
      <AdminTopbar title="Sự kiện" description="Lịch sự kiện hiển thị ở /su-kien — khác Tin tức" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allEvents.length})
            </span>
          </div>
          {allEvents.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có sự kiện nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{e.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      {formatVNDateTime(e.startAt)}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/su-kien?edit=${e.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
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
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.title}` : "Thêm sự kiện"}
            </span>
            {editing && (
              <a href="/admin/su-kien" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertEventAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên sự kiện</label>
              <input
                name="title"
                required
                defaultValue={editing?.title}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Ngày hội tư vấn tuyển sinh 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Bắt đầu</label>
                <input
                  name="startAt"
                  type="datetime-local"
                  required
                  defaultValue={toDatetimeLocalValue(editing?.startAt)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Kết thúc (tuỳ chọn)
                </label>
                <input
                  name="endAt"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(editing?.endAt)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Địa điểm (tuỳ chọn)
              </label>
              <input
                name="location"
                defaultValue={editing?.location ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Hội trường A, cơ sở chính"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Mô tả (tuỳ chọn)
              </label>
              <MarkdownEditor
                name="description"
                rows={5}
                defaultValue={editing?.description ?? ""}
                placeholder="Nội dung chi tiết sự kiện..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh sự kiện (tuỳ chọn) {editing ? "— để trống = giữ ảnh cũ" : ""}
              </label>
              <ImagePicker
                fileFieldName="coverImage"
                pickedFieldName="coverImageExisting"
                images={mediaImages}
                currentUrl={editing?.coverImageUrl}
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "title", enName: "titleEn" },
                    { viName: "location", enName: "locationEn" },
                    { viName: "description", enName: "descriptionEn" },
                  ]}
                />
                <input
                  name="titleEn"
                  defaultValue={editing?.titleEn ?? ""}
                  placeholder="Title (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <input
                  name="locationEn"
                  defaultValue={editing?.locationEn ?? ""}
                  placeholder="Location (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <MarkdownEditor
                  name="descriptionEn"
                  rows={5}
                  defaultValue={editing?.descriptionEn ?? ""}
                  placeholder="Description (English)"
                />
              </div>
            </details>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm sự kiện"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
