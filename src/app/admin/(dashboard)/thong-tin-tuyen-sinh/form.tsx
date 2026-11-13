import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { db, schema } from "@/lib/db";
import { hasPlaceholder } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { SECTIONS, sectionType } from "./sections";
import { AdmissionItemFields } from "./item-fields";

/** Trang Thêm (không có `id`, nhóm theo `?type=`) / Sửa mục thông tin tuyển sinh. */
export async function AdmissionItemFormPage({ id, type }: { id?: string; type?: string }) {
  await requirePermission("admissions-contact");
  const editing = id ? await db.query.admissionItems.findFirst({ where: eq(schema.admissionItems.id, id) }) : null;
  if (id && !editing) notFound();
  const formType = editing ? sectionType(editing.type) : sectionType(type);
  const [{ total }] = await db.select({ total: count() }).from(schema.admissionItems).where(eq(schema.admissionItems.type, formType));
  const backHref = `/admin/thong-tin-tuyen-sinh?type=${formType}`;
  const needsFill = editing && (
    hasPlaceholder(editing.title) || hasPlaceholder(editing.detail) ||
    (formType === "timeline" && hasPlaceholder(editing.meta))
  );

  return (
    <AdminFormLayout
      title={editing ? "Sửa mục tuyển sinh" : `Thêm mục: ${SECTIONS.find((s) => s.type === formType)!.title}`}
      description="Mốc thời gian, phương thức và hồ sơ hiển thị ở trang /tuyen-sinh"
      backHref={backHref}
    >
      {needsFill && (
        <div role="alert" className="mb-5 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
          ⚠️ Mục này còn ghi chú dạng <code>[Trường điền: …]</code> — web công khai đang hiện &quot;Đang cập nhật&quot; thay cho phần này.
        </div>
      )}
      <AdmissionItemFields key={id ?? formType} editing={editing} initialType={formType} defaultSortOrder={total} backHref={backHref} />
    </AdminFormLayout>
  );
}
