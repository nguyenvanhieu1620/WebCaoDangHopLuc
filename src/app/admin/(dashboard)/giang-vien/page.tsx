import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertFacultyAction, deleteFacultyAction } from "./actions";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

export default async function AdminFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const allFaculty = await db.query.faculty.findMany({
    orderBy: asc(schema.faculty.sortOrder),
  });
  const editing = edit
    ? await db.query.faculty.findFirst({ where: eq(schema.faculty.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Đội ngũ giảng viên"
        description="Thẻ giảng viên hiển thị ở Trang chủ"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allFaculty.length})
            </span>
          </div>
          {allFaculty.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có giảng viên nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allFaculty.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-paper-alt">
                      {f.photoUrl && (
                        <Image src={f.photoUrl} alt={f.name} fill className="object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">{f.name}</div>
                      <div className="text-[11.5px] text-ink-faint">
                        {f.role} · vị trí #{f.sortOrder}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/giang-vien?edit=${f.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deleteFacultyAction(f.id);
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

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.name}` : "Thêm giảng viên"}
            </span>
            {editing && (
              <a href="/admin/giang-vien" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertFacultyAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Họ tên</label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: ThS.BS Nguyễn Văn An"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Chức danh</label>
              <input
                name="role"
                required
                defaultValue={editing?.role}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Trưởng khoa Điều dưỡng"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh chân dung {editing ? "(để trống = giữ ảnh cũ)" : ""}
              </label>
              {editing?.photoUrl && (
                <Image
                  src={editing.photoUrl}
                  alt={editing.name}
                  width={64}
                  height={64}
                  className="mb-2 h-16 w-16 rounded-full border border-line object-cover"
                />
              )}
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allFaculty.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm giảng viên"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
