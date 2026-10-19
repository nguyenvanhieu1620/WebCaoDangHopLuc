import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertFacultyAction } from "./actions";

const input = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Trang Thêm (không có `id`) / Sửa giảng viên — dùng chung cho `them-moi/` và `[id]/`. */
export async function FacultyFormPage({ id }: { id?: string }) {
  await requirePermission("faculty");
  const [editing, departments, attributes, mediaImages, [{ total }]] = await Promise.all([
    id ? db.query.faculty.findFirst({ where: eq(schema.faculty.id, id) }) : null,
    db.query.departments.findMany({ orderBy: [asc(schema.departments.sortOrder), asc(schema.departments.seq)] }),
    db.query.facultyAttributes.findMany({ orderBy: [asc(schema.facultyAttributes.sortOrder), asc(schema.facultyAttributes.seq)] }),
    listMediaImages(),
    db.select({ total: count() }).from(schema.faculty),
  ]);
  if (id && !editing) notFound();
  const academicRanks = attributes.filter((a) => a.type === "academic_rank");
  const degrees = attributes.filter((a) => a.type === "degree");
  const positions = attributes.filter((a) => a.type === "position");

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : "Thêm giảng viên"}
      description="Thẻ giảng viên hiển thị ở Trang chủ và /doi-ngu-giang-vien"
      backHref="/admin/giang-vien"
      wide
    >
      {editing?.slug && (
        <p className="mb-5 text-[12.5px] text-ink-faint">
          Trang trên web:{" "}
          <a href={`/doi-ngu-giang-vien/${editing.slug}`} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-brand-700 hover:underline">
            /doi-ngu-giang-vien/{editing.slug} ↗
          </a>
        </p>
      )}
      <form action={upsertFacultyAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div>
              <label htmlFor="f-giang-vien-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Họ tên (chỉ tên thuần, không gõ học vị vào đây)
              </label>
              <input id="f-giang-vien-name" name="name" required defaultValue={editing?.name} className={input} placeholder="VD: Nguyễn Văn An" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="f-giang-vien-degree" className="mb-1.5 block text-xs font-semibold text-ink-soft">Học vị (tuỳ chọn)</label>
                <select id="f-giang-vien-degree" name="degree" defaultValue={editing?.degree ?? ""} className={input}>
                  <option value="">— Không chọn —</option>
                  {degrees.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-giang-vien-academicRank" className="mb-1.5 block text-xs font-semibold text-ink-soft">Học hàm (hiếm, tuỳ chọn)</label>
                <select id="f-giang-vien-academicRank" name="academicRank" defaultValue={editing?.academicRank ?? ""} className={input}>
                  <option value="">— Không chọn —</option>
                  {academicRanks.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="-mt-2 text-[11px] text-ink-faint">
              Chưa có lựa chọn cần thiết?{" "}
              <Link href="/admin/danh-hieu" className="font-semibold text-brand-700 hover:underline">
                Thêm ở Học hàm / Học vị / Chức vụ
              </Link>
              . Hiển thị công khai sẽ tự ghép: {"{Học hàm} {Học vị} {Họ tên}"} — VD &quot;PGS. ThS.BS Nguyễn Văn An&quot;.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="f-giang-vien-role" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chức vụ</label>
                <select id="f-giang-vien-role" name="role" required defaultValue={editing?.role ?? ""} className={input}>
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
                <label htmlFor="f-giang-vien-departmentId" className="mb-1.5 block text-xs font-semibold text-ink-soft">Khoa / Bộ môn (tuỳ chọn)</label>
                <select id="f-giang-vien-departmentId" name="departmentId" defaultValue={editing?.departmentId ?? ""} className={input}>
                  <option value="">— Không thuộc khoa nào —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="f-giang-vien-specialty" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chuyên môn (tuỳ chọn)</label>
              <input
                id="f-giang-vien-specialty"
                name="specialty"
                defaultValue={editing?.specialty ?? ""}
                className={input}
                placeholder="VD: Điều dưỡng hồi sức cấp cứu"
              />
              <p className="mt-1.5 text-[11px] text-ink-faint">Hiện trên thẻ giảng viên và tìm kiếm được ở trang Đội ngũ giảng viên.</p>
            </div>
          </div>
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
        </div>
        <div>
          <label htmlFor="f-giang-vien-bio" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Tiểu sử đầy đủ (tuỳ chọn — hiện ở trang chi tiết)
          </label>
          <MarkdownEditor
            id="f-giang-vien-bio"
            name="bio"
            rows={10}
            defaultValue={editing?.bio ?? ""}
            placeholder="Quá trình công tác, nơi đào tạo, thành tích, kinh nghiệm giảng dạy..."
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
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
              className={input}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input aria-label="Degree (English)" name="degreeEn" defaultValue={editing?.degreeEn ?? ""} placeholder="Degree (English)" className={input} />
              <input
                aria-label="Academic rank (English)"
                name="academicRankEn"
                defaultValue={editing?.academicRankEn ?? ""}
                placeholder="Academic rank (English)"
                className={input}
              />
            </div>
            <input aria-label="Specialty (English)" name="specialtyEn" defaultValue={editing?.specialtyEn ?? ""} placeholder="Specialty (English)" className={input} />
            <MarkdownEditor aria-label="Full bio (English)" name="bioEn" rows={6} defaultValue={editing?.bioEn ?? ""} placeholder="Full bio (English)" />
          </div>
        </details>
        <div>
          <label htmlFor="f-giang-vien-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input id="f-giang-vien-sortOrder" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? total} className={`${input} max-w-[200px]`} />
        </div>
        <FormActions cancelHref="/admin/giang-vien" submitLabel={editing ? "Lưu thay đổi" : "Thêm giảng viên"} />
      </form>
    </AdminFormLayout>
  );
}
