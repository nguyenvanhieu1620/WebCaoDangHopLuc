import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { hasPermission, requirePermission } from "@/lib/admin-auth";
import { db, schema } from "@/lib/db";
import { getSiteSettings } from "@/lib/data/site-settings";
import { quickContactHotlineHref, quickContactHotlineLabel } from "@/lib/quick-contact-hotline";
import { QuickContactFields } from "./contact-fields";

export async function QuickContactFormPage({ id }: { id?: string }) {
  const user = await requirePermission("admissions-contact");
  const [editing, [{ total }], settings] = await Promise.all([
    id ? db.query.quickContacts.findFirst({ where: eq(schema.quickContacts.id, id) }) : null,
    db.select({ total: count() }).from(schema.quickContacts),
    getSiteSettings(),
  ]);
  if (id && !editing) notFound();
  const hotline = quickContactHotlineHref(settings.hotline) ? settings.hotline : null;
  const title = editing?.type === "hotline" ? quickContactHotlineLabel(hotline ?? "") : editing?.label;

  return (
    <AdminFormLayout
      title={title ? `Sửa: ${title}` : "Thêm nút liên hệ"}
      description="Các nút nổi góc màn hình ở mọi trang công khai — bấm nút + để xoè ra"
      backHref="/admin/lien-he-nhanh"
    >
      <QuickContactFields
        key={id ?? "new"}
        editing={editing}
        defaultSortOrder={total}
        hotline={hotline}
        canEditSettings={hasPermission(user, "site-settings")}
      />
    </AdminFormLayout>
  );
}
