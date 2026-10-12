import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { QuickContact } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";
import { normalizeExternalUrl, normalizeZaloUrl } from "@/lib/utils";

/** Danh sách nút liên hệ nhanh nổi góc màn hình — quản lý qua admin/lien-he-nhanh. */
export async function getQuickContacts(): Promise<QuickContact[]> {
  const [rows, locale] = await Promise.all([
    db.query.quickContacts.findMany({ orderBy: [asc(schema.quickContacts.sortOrder), asc(schema.quickContacts.seq)] }),
    getLocale(),
  ]);
  return rows
    // Zalo/Facebook luôn là link web — sửa giá trị lỡ dán sai ("#https://…", thiếu https://).
    // Loại khác giữ nguyên (tel:, mailto:, đường dẫn nội bộ "/lien-he"…).
    .map((r) => ({
      ...r,
      href:
        r.type === "zalo"
          ? normalizeZaloUrl(r.href) ?? ""
          : r.type === "facebook"
            ? normalizeExternalUrl(r.href) ?? ""
            : r.href.trim(),
      label: pickLocale(r.label, r.labelEn, locale),
    }))
    .filter((r) => r.href && r.href !== "#");
}
