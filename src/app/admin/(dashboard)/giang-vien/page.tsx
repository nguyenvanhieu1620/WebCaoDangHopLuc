import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { facultyDisplayName } from "@/lib/data/faculty";
import { upsertFacultyAction, deleteFacultyAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đội ngũ giảng viên" };

export default async function AdminFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("faculty");
  const { edit } = await searchParams;
  const [allFaculty, departments, attributes, mediaImages] = await Promise.all([
    db.query.faculty.findMany({ orderBy: [asc(schema.faculty.sortOrder), asc(schema.faculty.seq)] }),
    db.query.departments.findMany({ orderBy: [asc(schema.departments.sortOrder), asc(schema.departments.seq)] }),
    db.query.facultyAttributes.findMany({ orderBy: [asc(schema.facultyAttributes.sortOrder), asc(schema.facultyAttributes.seq)] }),
    db.query.mediaItems.findMany({
      where: eq(schema.mediaItems.type, "image"),
      orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
    }),
  ]);
  const editing = edit
    ? await db.query.faculty.findFirst({ where: eq(schema.faculty.id, edit) })
    : null;
  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));
  const academicRanks = attributes.filter((a) => a.type === "academic_rank");
  const degrees = attributes.filter((a) => a.type === "degree");
  const positions = attributes.filter((a) => a.type === "position");

  return (
    <div>
      <AdminTopbar
        title="Đội ngũ giảng viên"
        description="Thẻ giảng viên hiển thị ở Trang chủ và /doi-ngu-giang-vien — quản lý Khoa/Bộ môn riêng ở mục Khoa / Bộ môn"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
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
                      <div className="text-sm font-medium text-ink">{facultyDisplayName(f)}</div>
                      <div className="text-[11.5px] text-ink-faint">
                        {f.role}
                        {f.departmentId && departmentNameById.get(f.departmentId)
                          ? ` · ${departmentNameById.get(f.departmentId)}`
                          : ""}{" "}
                        · vị trí #{f.sortOrder}
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
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá giảng viên "${f.name}"? Không thể hoàn tác.`}
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
              <label htmlFor="f-giang-vien-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Họ tên (chỉ tên thuần, không gõ học vị vào đây)
              </label>
              <input
                id="f-giang-vien-name"
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Nguyễn Văn An"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-giang-vien-degree" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Học vị (tuỳ chọn)
                </label>
                <select
                  id="f-giang-vien-degree"
                  name="degree"
                  defaultValue={editing?.degree ?? ""}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">— Không chọn —</option>
                  {degrees.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-giang-vien-academicRank" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Học hàm (hiếm, tuỳ chọn)
                </label>
                <select
                  id="f-giang-vien-academicRank"
                  name="academicRank"
                  defaultValue={editing?.academicRank ?? ""}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">— Không chọn —</option>
                  {academicRanks.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-ink-faint">
              Chưa có lựa chọn cần thiết?{" "}
              <a href="/admin/danh-hieu" className="font-semibold text-brand-700 hover:underline">
                Thêm ở Học hàm / Học vị / Chức vụ
              </a>
              . Hiển thị công khai sẽ tự ghép: {"{Học hàm} {Học vị} {Họ tên}"} — VD &quot;PGS.
              ThS.BS Nguyễn Văn An&quot;.
            </p>
            <div>
              <label htmlFor="f-giang-vien-role" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chức vụ</label>
              <select
                id="f-giang-vien-role"
                name="role"
                required
                defaultValue={editing?.role ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="" disabled>
                  — Chọn chức vụ —
                </option>
                {positions.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-giang-vien-departmentId" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Khoa / Bộ môn (tuỳ chọn)
              </label>
              <select
                id="f-giang-vien-departmentId"
                name="departmentId"
                defaultValue={editing?.departmentId ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">— Không thuộc khoa nào —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-giang-vien-specialty" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Chuyên môn (tuỳ chọn)
              </label>
              <input
                id="f-giang-vien-specialty"
                name="specialty"
                defaultValue={editing?.specialty ?? ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Điều dưỡng hồi sức cấp cứu"
              />
            </div>
            <div>
              <label htmlFor="f-giang-vien-bio" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Tiểu sử đầy đủ (tuỳ chọn — hiện ở trang chi tiết)
              </label>
              <MarkdownEditor
                id="f-giang-vien-bio"
                name="bio"
                rows={5}
                defaultValue={editing?.bio ?? ""}
                placeholder="Quá trình công tác, nơi đào tạo, thành tích, kinh nghiệm giảng dạy..."
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "role", enName: "roleEn" },
                    { viName: "degree", enName: "degreeEn" },
                    { viName: "academicRank", enName: "academicRankEn" },
                    { viName: "specialty", enName: "specialtyEn" },
                    { viName: "bio", enName: "bioEn" },
                  ]}
                />
                <input
                  aria-label="Role (English) — VD: Head of Nursing Department"
                  name="roleEn"
                  defaultValue={editing?.roleEn ?? ""}
                  placeholder="Role (English) — VD: Head of Nursing Department"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    aria-label="Degree (English)"
                    name="degreeEn"
                    defaultValue={editing?.degreeEn ?? ""}
                    placeholder="Degree (English)"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    aria-label="Academic rank (English)"
                    name="academicRankEn"
                    defaultValue={editing?.academicRankEn ?? ""}
                    placeholder="Academic rank (English)"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <input
                  aria-label="Specialty (English)"
                  name="specialtyEn"
                  defaultValue={editing?.specialtyEn ?? ""}
                  placeholder="Specialty (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <MarkdownEditor
                  aria-label="Full bio (English)"
                  name="bioEn"
                  rows={5}
                  defaultValue={editing?.bioEn ?? ""}
                  placeholder="Full bio (English)"
                />
              </div>
            </details>
            <div>
              <label htmlFor="f-giang-vien-photo" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Ảnh chân dung {editing ? "(để trống = giữ ảnh cũ)" : ""}
              </label>
              <ImagePicker
                id="f-giang-vien-photo"
                spec="portrait"
                fileFieldName="photo"
                pickedFieldName="photoExisting"
                images={mediaImages}
                currentUrl={editing?.photoUrl}
              />
            </div>
            <div>
              <label htmlFor="f-giang-vien-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                id="f-giang-vien-sortOrder"
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
