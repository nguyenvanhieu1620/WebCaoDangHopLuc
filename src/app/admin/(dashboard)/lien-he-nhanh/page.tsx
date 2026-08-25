import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertQuickContactAction, deleteQuickContactAction } from "./actions";

export const metadata: Metadata = { title: "Liên hệ nhanh" };

const TYPE_LABELS: Record<string, string> = {
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
  chatbot: "Link dịch vụ chatbot (VD trang chat Zalo OA, Messenger, hoặc dịch vụ khác)",
  custom: "Bất kỳ link nào",
};

export default async function AdminQuickContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const all = await db.query.quickContacts.findMany({ orderBy: asc(schema.quickContacts.sortOrder) });
  const editing = edit
    ? await db.query.quickContacts.findFirst({ where: eq(schema.quickContacts.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Liên hệ nhanh"
        description="Các nút nổi góc màn hình ở mọi trang công khai — bấm nút + để xoè ra"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">Danh sách ({all.length})</span>
          </div>
          {all.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có nút liên hệ nhanh nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {all.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                        {TYPE_LABELS[c.type] ?? c.type}
                      </span>
                      <span className="truncate text-sm font-medium text-ink">{c.label}</span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-ink-faint">
                      {c.href} · vị trí #{c.sortOrder}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/lien-he-nhanh?edit=${c.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deleteQuickContactAction(c.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá nút "${c.label}"? Không thể hoàn tác.`}
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
              {editing ? "Sửa nút liên hệ" : "Thêm nút liên hệ"}
            </span>
            {editing && (
              <a href="/admin/lien-he-nhanh" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertQuickContactAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Loại</label>
              <select
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
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên hiển thị</label>
              <input
                name="label"
                required
                defaultValue={editing?.label}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Gọi hotline tuyển sinh"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Tên tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3">
                <AutoTranslateButton pairs={[{ viName: "label", enName: "labelEn" }]} />
                <input
                  name="labelEn"
                  defaultValue={editing?.labelEn ?? ""}
                  placeholder="Label (English)"
                  className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </details>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Link (nhập nguyên link, VD tel:/https://...)
              </label>
              <input
                name="href"
                required
                defaultValue={editing?.href}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: tel:19006868"
              />
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Gợi ý theo loại: {editing?.type ? TYPE_HINTS[editing.type] : "chọn loại ở trên để xem gợi ý"}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Vị trí (số nhỏ hiện trước)
              </label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? all.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm nút liên hệ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
