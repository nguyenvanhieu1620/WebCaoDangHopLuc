import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { upsertQuickContactAction } from "./actions";

export const TYPE_LABELS: Record<string, string> = {
  hotline: "Hotline",
  zalo: "Zalo",
  facebook: "Facebook Messenger",
  message: "Tin nhắn / SMS",
  chatbot: "ChatbotAI",
  custom: "Khác",
};

const TYPE_HINTS: Record<string, string> = {
  hotline: "tel:19006868",
  zalo: "https://zalo.me/xxxxxxxxxxxx",
  facebook: "https://m.me/tenpagefacebook",
  message: "sms:0900000000 hoặc link ứng dụng nhắn tin",
  chatbot: "Link dịch vụ chatbot (VD trang chat Zalo OA, Messenger…)",
  custom: "Bất kỳ link nào",
};

/** Trang Thêm (không có `id`) / Sửa nút liên hệ nhanh — dùng chung cho `them-moi/` và `[id]/`. */
export async function QuickContactFormPage({ id }: { id?: string }) {
  await requirePermission("admissions-contact");
  const editing = id ? await db.query.quickContacts.findFirst({ where: eq(schema.quickContacts.id, id) }) : null;
  if (id && !editing) notFound();
  const [{ total }] = await db.select({ total: count() }).from(schema.quickContacts);

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.label}` : "Thêm nút liên hệ"}
      description="Các nút nổi góc màn hình ở mọi trang công khai — bấm nút + để xoè ra"
      backHref="/admin/lien-he-nhanh"
    >
      <form action={upsertQuickContactAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-lien-he-nhanh-type" className="mb-1.5 block text-xs font-semibold text-ink-soft">Loại</label>
          <select
            id="f-lien-he-nhanh-type"
            name="type"
            required
            defaultValue={editing?.type ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="" disabled>
              — Chọn loại —
            </option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-lien-he-nhanh-label" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên hiển thị</label>
          <input
            id="f-lien-he-nhanh-label"
            name="label"
            required
            defaultValue={editing?.label}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Gọi hotline tuyển sinh"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Tên tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "label", enName: "labelEn" }]} />
            <input
              aria-label="Label (English)"
              name="labelEn"
              defaultValue={editing?.labelEn ?? ""}
              placeholder="Label (English)"
              className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <div>
          <label htmlFor="f-lien-he-nhanh-href" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Link (nhập nguyên link, VD tel:/https://...)
          </label>
          <input
            id="f-lien-he-nhanh-href"
            name="href"
            required
            defaultValue={editing?.href}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: tel:19006868"
          />
          <dl className="mt-2.5 grid gap-x-4 gap-y-1 rounded-lg bg-paper-alt px-3 py-2.5 text-[11.5px] sm:grid-cols-[auto_minmax(0,1fr)]">
            {Object.entries(TYPE_HINTS).map(([type, hint]) => (
              <div key={type} className="contents">
                <dt className="font-semibold text-ink-soft">{TYPE_LABELS[type]}</dt>
                <dd className="font-mono text-ink-faint [overflow-wrap:anywhere]">{hint}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <label htmlFor="f-lien-he-nhanh-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input
            id="f-lien-he-nhanh-sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={editing?.sortOrder ?? total}
            className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <FormActions cancelHref="/admin/lien-he-nhanh" submitLabel={editing ? "Lưu thay đổi" : "Thêm nút liên hệ"} />
      </form>
    </AdminFormLayout>
  );
}
