import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";
import { hasPlaceholder } from "@/lib/utils";
import { upsertAdmissionItemAction, deleteAdmissionItemAction, type AdmissionItemType } from "./actions";

export const metadata: Metadata = { title: "Thông tin tuyển sinh" };

const SECTIONS: { type: AdmissionItemType; title: string; hint: string }[] = [
  { type: "timeline", title: "Mốc thời gian", hint: "Các giai đoạn tuyển sinh — ô \"Thời gian\" hiện nổi bật trên dòng thời gian." },
  { type: "method", title: "Phương thức & điều kiện", hint: "Phương thức xét tuyển, đối tượng, điều kiện…" },
  { type: "document", title: "Hồ sơ cần chuẩn bị", hint: "Mỗi mục là 1 dòng trong danh sách kiểm tra." },
];

const inputClass = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

export default async function AdminAdmissionInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; type?: string }>;
}) {
  await requirePermission("admissions-contact");
  const { edit, type } = await searchParams;
  const all = await db.query.admissionItems.findMany({ orderBy: asc(schema.admissionItems.sortOrder) });
  const editing = edit ? await db.query.admissionItems.findFirst({ where: eq(schema.admissionItems.id, edit) }) : null;
  const formType: AdmissionItemType =
    (editing?.type as AdmissionItemType) ?? (SECTIONS.some((s) => s.type === type) ? (type as AdmissionItemType) : "timeline");
  const placeholderCount = all.filter((i) => hasPlaceholder(i.title) || hasPlaceholder(i.detail) || hasPlaceholder(i.meta)).length;

  return (
    <div>
      <AdminTopbar
        title="Thông tin tuyển sinh"
        description="Mốc thời gian, phương thức và hồ sơ hiển thị ở trang /tuyen-sinh"
      />
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {placeholderCount > 0 && (
            <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-[13px] text-accent-700">
              ⚠️ Có <strong>{placeholderCount}</strong> mục còn ghi chú dạng <code>[Trường điền: …]</code>. Web công khai
              tạm hiện &quot;Đang cập nhật&quot; ở các chỗ này — hãy điền thông tin thật trước khi công bố tuyển sinh.
            </div>
          )}
          {SECTIONS.map((section) => {
            const items = all.filter((i) => i.type === section.type);
            return (
              <div key={section.type} className="rounded-2xl border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-brand-900">
                      {section.title} ({items.length})
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-faint">{section.hint}</div>
                  </div>
                  <a
                    href={`/admin/thong-tin-tuyen-sinh?type=${section.type}`}
                    className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-brand-700 hover:border-brand-500"
                  >
                    + Thêm mục
                  </a>
                </div>
                {items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-ink-faint">Chưa có mục nào — mục này sẽ được ẩn trên web.</div>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((item) => {
                      const needsFill = hasPlaceholder(item.title) || hasPlaceholder(item.detail) || hasPlaceholder(item.meta);
                      return (
                        <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                              <span className="truncate">#{item.sortOrder} · {item.title}</span>
                              {needsFill && (
                                <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[10.5px] font-semibold text-accent-700">
                                  ⚠️ Chưa điền
                                </span>
                              )}
                            </div>
                            {(item.meta || item.detail) && (
                              <div className="mt-0.5 truncate text-[12px] text-ink-faint">
                                {[item.meta, item.detail].filter(Boolean).join(" — ")}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <a
                              href={`/admin/thong-tin-tuyen-sinh?edit=${item.id}`}
                              className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                            >
                              Sửa
                            </a>
                            <form
                              action={async () => {
                                "use server";
                                await deleteAdmissionItemAction(item.id);
                              }}
                            >
                              <ConfirmDeleteButton
                                className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                                confirmMessage={`Xoá "${item.title}"? Không thể hoàn tác.`}
                              >
                                Xoá
                              </ConfirmDeleteButton>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6 xl:sticky xl:top-24">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">{editing ? "Sửa mục" : "Thêm mục mới"}</span>
            {editing && (
              <a href="/admin/thong-tin-tuyen-sinh" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? `new-${formType}`} action={upsertAdmissionItemAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label htmlFor="ai-type" className="mb-1.5 block text-xs font-semibold text-ink-soft">Thuộc nhóm</label>
              <select id="ai-type" name="type" defaultValue={formType} className={inputClass}>
                {SECTIONS.map((s) => (
                  <option key={s.type} value={s.type}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ai-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề</label>
              <input id="ai-title" name="title" required maxLength={200} defaultValue={editing?.title} className={inputClass} placeholder="VD: Nộp hồ sơ xét tuyển" />
            </div>
            <div>
              <label htmlFor="ai-meta" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Thời gian <span className="font-normal text-ink-faint">(chỉ dùng cho Mốc thời gian)</span>
              </label>
              <input id="ai-meta" name="meta" maxLength={120} defaultValue={editing?.meta ?? ""} className={inputClass} placeholder="VD: 01/03 – 30/06/2026" />
            </div>
            <div>
              <label htmlFor="ai-detail" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Mô tả <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
              </label>
              <textarea id="ai-detail" name="detail" rows={3} maxLength={600} defaultValue={editing?.detail ?? ""} className={inputClass} />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "title", enName: "titleEn" },
                    { viName: "meta", enName: "metaEn" },
                    { viName: "detail", enName: "detailEn" },
                  ]}
                />
                <input name="titleEn" defaultValue={editing?.titleEn ?? ""} placeholder="Title (English)" className={inputClass} />
                <input name="metaEn" defaultValue={editing?.metaEn ?? ""} placeholder="Time (English)" className={inputClass} />
                <textarea name="detailEn" rows={3} defaultValue={editing?.detailEn ?? ""} placeholder="Description (English)" className={inputClass} />
              </div>
            </details>
            <div>
              <label htmlFor="ai-sort" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                id="ai-sort"
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? all.filter((i) => i.type === formType).length}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm mục"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
