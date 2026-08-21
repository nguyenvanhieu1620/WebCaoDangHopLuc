import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertProgramAction, deleteProgramAction } from "./actions";

export const metadata: Metadata = { title: "Quản lý ngành đào tạo" };

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const allPrograms = await db.query.programs.findMany({
    orderBy: asc(schema.programs.createdAt),
  });
  const editing = edit
    ? await db.query.programs.findFirst({ where: eq(schema.programs.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Ngành đào tạo"
        description="Quản lý danh sách ngành đào tạo hiển thị ở Trang chủ & /nganh-dao-tao"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_400px]">
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
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {p.code} — {p.name}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-faint">
                      {p.duration} · {p.intake} chỉ tiêu
                      {p.featured === 1 && (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">
                          Hiện ở Trang chủ
                        </span>
                      )}
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
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                      >
                        Xoá
                      </button>
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
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Mã ngành</label>
                <input
                  name="code"
                  required
                  defaultValue={editing?.code}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: ĐD"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Thời gian đào tạo</label>
                <input
                  name="duration"
                  required
                  defaultValue={editing?.duration}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="VD: 3 năm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên ngành</label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Điều dưỡng"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Chỉ tiêu</label>
              <input
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
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Mô tả ngắn</label>
              <textarea
                name="summary"
                required
                rows={3}
                defaultValue={editing?.summary}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Hiển thị ở thẻ ngành Trang chủ & trang danh sách"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Nội dung chi tiết (tuỳ chọn)
              </label>
              <textarea
                name="content"
                rows={4}
                defaultValue={editing?.content ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Dành cho trang chi tiết ngành đào tạo (làm sau) — có thể để trống"
              />
            </div>
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
