import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertPartnerAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa đối tác — dùng chung cho `them-moi/` và `[id]/`. */
export async function PartnerFormPage({ id }: { id?: string }) {
  await requirePermission("partners");
  const [editing, mediaImages, [{ total }]] = await Promise.all([
    id ? db.query.partners.findFirst({ where: eq(schema.partners.id, id) }) : null,
    listMediaImages(),
    db.select({ total: count() }).from(schema.partners),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : "Thêm đối tác"}
      description="Dải logo/tên đối tác chạy ngang ở Trang chủ — vị trí càng nhỏ hiện càng trước"
      backHref="/admin/doi-tac"
    >
      <form action={upsertPartnerAction} className="space-y-5">
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
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Tên tiếng Anh (tuỳ chọn)</summary>
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
          <ImagePicker id="f-doi-tac-logo" spec="logo" fileFieldName="logo" pickedFieldName="logoExisting" images={mediaImages} currentUrl={editing?.logoUrl} />
          {editing?.logoUrl && (
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
            defaultValue={editing?.sortOrder ?? total}
            className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <FormActions cancelHref="/admin/doi-tac" submitLabel={editing ? "Lưu thay đổi" : "Thêm đối tác"} />
      </form>
    </AdminFormLayout>
  );
}
