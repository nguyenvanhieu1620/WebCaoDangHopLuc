import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { upsertProgramAction, deleteProgramAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Quản lý ngành đào tạo" };

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("programs");
  const { edit } = await searchParams;
  const allPrograms = await db.query.programs.findMany({
    orderBy: [asc(schema.programs.createdAt), asc(schema.programs.seq)],
  });
  const editing = edit
    ? await db.query.programs.findFirst({ where: eq(schema.programs.id, edit) })
    : null;
  const mediaImages = await db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });

  return (
    <div>
      <AdminTopbar
        title="Ngành đào tạo"
        description="Quản lý danh sách ngành đào tạo hiển thị ở Trang chủ & /nganh-dao-tao"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Danh sách ngành */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allPrograms.length})
            </span>
          </div>
          {allPrograms.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có ngành đào tạo nào. Thêm ngành đầu tiên ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allPrograms.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong admin, không cần tối ưu
                    <img src={p.imageUrl} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-ink-faint">
                      Chưa ảnh
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {p.code} — {p.name}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-faint">
                      {p.duration} · {p.intake} chỉ tiêu · {p.tuition ? `Học phí ${p.tuition}` : "Chưa nhập học phí"}
                      {p.featured === 1 && (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">
                          Hiện ở Trang chủ
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/nganh-dao-tao?edit=${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deleteProgramAction(p.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá ngành "${p.name}"? Không thể hoàn tác.`}
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

        {/* Form thêm/sửa */}
        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.name}` : "Thêm ngành mới"}
            </span>
            {editing && (
              <a href="/admin/nganh-dao-tao" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertProgramAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-nganh-dao-tao-code" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mã ngành</label>
                <input
                  id="f-nganh-dao-tao-code"
                  name="code"
                  required
                  defaultValue={editing?.code}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: ĐD"
                />
              </div>
              <div>
                <label htmlFor="f-nganh-dao-tao-duration" className="mb-1.5 block text-xs font-semibold text-ink-soft">Thời gian đào tạo</label>
                <input
                  id="f-nganh-dao-tao-duration"
                  name="duration"
                  required
                  defaultValue={editing?.duration}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: 3 năm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="f-nganh-dao-tao-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên ngành</label>
              <input
                id="f-nganh-dao-tao-name"
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Điều dưỡng"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-nganh-dao-tao-intake" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chỉ tiêu</label>
                <input
                  id="f-nganh-dao-tao-intake"
                  name="intake"
                  type="number"
                  required
                  min={1}
                  defaultValue={editing?.intake}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: 350"
                />
              </div>
              <div>
                <label htmlFor="program-tuition" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Học phí <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
                </label>
                <input
                  id="program-tuition"
                  name="tuition"
                  maxLength={80}
                  defaultValue={editing?.tuition ?? ""}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: 1.840.000đ/tháng"
                />
              </div>
            </div>
            <p className="-mt-1.5 text-[11px] text-ink-faint">Để trống học phí thì web hiện &quot;Liên hệ&quot; — chỉ nhập khi trường đã chốt mức chính thức.</p>
            <div>
              <label htmlFor="f-nganh-dao-tao-image" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh ngành <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
              </label>
              <ImagePicker id="f-nganh-dao-tao-image" spec="program" fileFieldName="image" pickedFieldName="imageExisting" images={mediaImages} currentUrl={editing?.imageUrl} />
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
                Để trống thì thẻ ngành chỉ có khối màu như cũ.
              </p>
              {editing?.imageUrl && (
                <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
                  <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-line" /> Gỡ ảnh hiện tại
                </label>
              )}
            </div>
            <div>
              <label htmlFor="f-nganh-dao-tao-summary" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mô tả ngắn</label>
              <textarea
                id="f-nganh-dao-tao-summary"
                name="summary"
                required
                rows={3}
                defaultValue={editing?.summary}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Hiển thị ở thẻ ngành Trang chủ & trang danh sách"
              />
            </div>
            <div>
              <label htmlFor="f-nganh-dao-tao-content" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Nội dung chi tiết (tuỳ chọn)
              </label>
              <textarea
                id="f-nganh-dao-tao-content"
                name="content"
                rows={4}
                defaultValue={editing?.content ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Hiện ở trang chi tiết ngành (hỗ trợ Markdown: ## Tiêu đề, - gạch đầu dòng) — có thể để trống"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "name", enName: "nameEn" },
                    { viName: "summary", enName: "summaryEn" },
                    { viName: "content", enName: "contentEn" },
                    { viName: "tuition", enName: "tuitionEn" },
                  ]}
                />
                <input
                  aria-label="Tuition (English), e.g. 1,840,000 VND/month"
                  name="tuitionEn"
                  defaultValue={editing?.tuitionEn ?? ""}
                  placeholder="Tuition (English), e.g. 1,840,000 VND/month"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <input
                  aria-label="Program name (English)"
                  name="nameEn"
                  defaultValue={editing?.nameEn ?? ""}
                  placeholder="Program name (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <textarea
                  aria-label="Short summary (English)"
                  name="summaryEn"
                  rows={3}
                  defaultValue={editing?.summaryEn ?? ""}
                  placeholder="Short summary (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <textarea
                  aria-label="Full detail content (English)"
                  name="contentEn"
                  rows={4}
                  defaultValue={editing?.contentEn ?? ""}
                  placeholder="Full detail content (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </details>
            <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={editing ? editing.featured === 1 : true}
                className="h-4 w-4 rounded border-line"
              />
              Hiện ở Trang chủ
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm ngành"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
