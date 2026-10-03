import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { hasPlaceholder } from "@/lib/utils";
import { upsertMilestoneAction, deleteMilestoneAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Cột mốc" };

const input = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Năm hiện tại — hàm thường ngoài component (rule react-hooks/purity cấm `new Date()` trong thân component). */
function currentYear(): number {
  return new Date().getFullYear();
}

/**
 * Cột mốc phát triển — dòng thời gian ở /gioi-thieu (chọn năm → hiện các mốc).
 * Cùng quyền với Trang tĩnh (module `pages`). Chưa có mốc nào thì khối dòng thời
 * gian trên web tự ẩn.
 */
export default async function AdminMilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("pages");
  const { edit } = await searchParams;
  const [all, editing, mediaImages] = await Promise.all([
    db.query.milestones.findMany({
      orderBy: [desc(schema.milestones.year), asc(schema.milestones.sortOrder), asc(schema.milestones.createdAt)],
    }),
    edit ? db.query.milestones.findFirst({ where: eq(schema.milestones.id, edit) }) : Promise.resolve(undefined),
    db.query.mediaItems.findMany({
      where: eq(schema.mediaItems.type, "image"),
      orderBy: desc(schema.mediaItems.createdAt),
    }),
  ]);

  const years = [...new Set(all.map((m) => m.year))];

  return (
    <div>
      <AdminTopbar
        title="Cột mốc phát triển"
        description="Dòng thời gian ở trang Giới thiệu — web hiện theo năm, trong năm theo vị trí (số nhỏ hiện trước)"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              {all.length} mốc · {years.length} năm
            </span>
            <a href="/gioi-thieu#cot-moc" target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">
              Xem trên web ↗
            </a>
          </div>
          {all.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có cột mốc nào — thêm ở form bên phải. Trang Giới thiệu sẽ tự hiện khối &quot;Những cột mốc&quot; khi có ít nhất 1 mốc.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {years.map((year) => (
                <div key={year} className="px-6 py-4">
                  <div className="mb-2 font-display text-[20px] font-bold text-brand-900">{year}</div>
                  <ul className="space-y-2">
                    {all
                      .filter((m) => m.year === year)
                      .map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {m.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong admin, không cần tối ưu
                              <img src={m.imageUrl} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                                <span className="font-mono text-[11px] text-ink-faint">#{m.sortOrder}</span>
                                {m.period && <span className="font-mono text-[11px] text-accent-600">{m.period}</span>}
                                <span className="truncate">{m.title}</span>
                                {(hasPlaceholder(m.title) || hasPlaceholder(m.description)) && (
                                  <span className="shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-[10.5px] font-semibold text-accent-700">⚠️ Chưa điền</span>
                                )}
                              </div>
                              {m.description && <div className="mt-0.5 truncate text-[12px] text-ink-faint">{m.description}</div>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <a
                              href={`/admin/cot-moc?edit=${m.id}`}
                              className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                            >
                              Sửa
                            </a>
                            <form
                              action={async () => {
                                "use server";
                                await deleteMilestoneAction(m.id);
                              }}
                            >
                              <ConfirmDeleteButton
                                className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                                confirmMessage={`Xoá cột mốc "${m.title}"? Không thể hoàn tác.`}
                              >
                                Xoá
                              </ConfirmDeleteButton>
                            </form>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">{editing ? "Sửa cột mốc" : "Thêm cột mốc"}</span>
            {editing && (
              <a href="/admin/cot-moc" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertMilestoneAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <div>
                <label htmlFor="ms-year" className="mb-1.5 block text-xs font-semibold text-ink-soft">Năm</label>
                <input id="ms-year" name="year" type="number" required min={1900} max={2100} defaultValue={editing?.year ?? years[0] ?? currentYear()} className={input} />
              </div>
              <div>
                <label htmlFor="ms-period" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Thời điểm <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
                </label>
                <input id="ms-period" name="period" maxLength={60} defaultValue={editing?.period ?? ""} placeholder="VD: Tháng 9" className={input} />
              </div>
            </div>
            <div>
              <label htmlFor="ms-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề mốc</label>
              <input id="ms-title" name="title" required maxLength={200} defaultValue={editing?.title} placeholder="VD: Khai giảng khoá đầu tiên ngành Điều dưỡng" className={input} />
            </div>
            <div>
              <label htmlFor="ms-desc" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Mô tả <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
              </label>
              <textarea id="ms-desc" name="description" rows={4} maxLength={2000} defaultValue={editing?.description ?? ""} className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
              </label>
              <ImagePicker fileFieldName="image" pickedFieldName="imageExisting" images={mediaImages} currentUrl={editing?.imageUrl} />
              {editing?.imageUrl && (
                <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
                  <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-line" /> Gỡ ảnh hiện tại
                </label>
              )}
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "period", enName: "periodEn" },
                    { viName: "title", enName: "titleEn" },
                    { viName: "description", enName: "descriptionEn" },
                  ]}
                />
                <input name="periodEn" defaultValue={editing?.periodEn ?? ""} placeholder="Period (English)" className={input} />
                <input name="titleEn" defaultValue={editing?.titleEn ?? ""} placeholder="Title (English)" className={input} />
                <textarea name="descriptionEn" rows={3} defaultValue={editing?.descriptionEn ?? ""} placeholder="Description (English)" className={input} />
              </div>
            </details>
            <div>
              <label htmlFor="ms-sort" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí trong năm (số nhỏ hiện trước)</label>
              <input id="ms-sort" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} className={input} />
            </div>
            <button type="submit" className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red">
              {editing ? "Lưu thay đổi" : "Thêm cột mốc"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
