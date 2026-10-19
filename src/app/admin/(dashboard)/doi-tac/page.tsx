import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { upsertPartnerAction, deletePartnerAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đối tác" };

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("partners");
  const { edit } = await searchParams;
  const allPartners = await db.query.partners.findMany({
    orderBy: [asc(schema.partners.sortOrder), asc(schema.partners.seq)],
  });
  const editing = edit
    ? await db.query.partners.findFirst({ where: eq(schema.partners.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });

  return (
    <div>
      <AdminTopbar
        title="Đối tác"
        description="Dải logo/tên đối tác chạy ngang ở Trang chủ — vị trí càng nhỏ hiện càng trước"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allPartners.length})
            </span>
          </div>
          {allPartners.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có đối tác nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allPartners.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-faint">#{p.sortOrder}</span>
                    {p.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- logo nhỏ trong admin, không cần tối ưu
                      <img src={p.logoUrl} alt="" className="h-7 w-auto max-w-[80px] object-contain" />
                    )}
                    <span className="truncate text-sm font-medium text-ink">{p.name}</span>
                    {p.websiteUrl && <span className="truncate font-mono text-[10.5px] text-ink-faint">{p.websiteUrl.replace(/^https?:\/\//, "")}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/doi-tac?edit=${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deletePartnerAction(p.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá đối tác "${p.name}"? Không thể hoàn tác.`}
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
              {editing ? `Sửa: ${editing.name}` : "Thêm đối tác"}
            </span>
            {editing && (
              <a href="/admin/doi-tac" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertPartnerAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label htmlFor="f-doi-tac-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên đối tác</label>
              <input
                id="f-doi-tac-name"
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Bệnh viện Nhi Thanh Hóa"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Tên tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3">
                <AutoTranslateButton pairs={[{ viName: "name", enName: "nameEn" }]} />
              </div>
              <input
                aria-label="Partner name (English)"
                name="nameEn"
                defaultValue={editing?.nameEn ?? ""}
                placeholder="Partner name (English)"
                className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </details>
            <div>
              <label htmlFor="f-doi-tac-logo" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Logo <span className="font-normal text-ink-faint">(tuỳ chọn — không có thì hiện tên chữ)</span>
              </label>
              <ImagePicker id="f-doi-tac-logo" spec="logo" fileFieldName="logo" pickedFieldName="logoExisting" images={mediaImages} currentUrl={editing?.logoUrl} />              {editing?.logoUrl && (
                <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
                  <input type="checkbox" name="removeLogo" className="h-4 w-4 rounded border-line" /> Gỡ logo hiện tại
                </label>
              )}
            </div>
            <div>
              <label htmlFor="partner-website" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Website <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
              </label>
              <input
                id="partner-website"
                name="websiteUrl"
                type="url"
                defaultValue={editing?.websiteUrl ?? ""}
                placeholder="https://..."
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="f-doi-tac-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                id="f-doi-tac-sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allPartners.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm đối tác"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
