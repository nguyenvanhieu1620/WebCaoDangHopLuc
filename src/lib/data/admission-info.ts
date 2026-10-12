import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";
import { hasPlaceholder } from "@/lib/utils";

export type AdmissionInfoItem = {
  id: string;
  title: string;
  detail: string | null;
  /** Thời gian (mốc tuyển sinh). `null` nếu chưa nhập hoặc còn ghi chú "[Trường điền…]". */
  meta: string | null;
};

export type AdmissionInfo = {
  timeline: AdmissionInfoItem[];
  methods: AdmissionInfoItem[];
  documents: AdmissionInfoItem[];
};

/**
 * Thông tin tuyển sinh cho /tuyen-sinh (bảng `admission_items`, quản lý ở
 * admin/thong-tin-tuyen-sinh). Ghi chú nội bộ dạng "[Trường điền: …]" KHÔNG
 * bao giờ lộ ra web công khai: ô thời gian còn placeholder trả `null` (trang
 * hiện "Đang cập nhật"), mục có tiêu đề còn placeholder bị ẩn hẳn.
 */
export async function getAdmissionInfo(): Promise<AdmissionInfo> {
  const [rows, locale] = await Promise.all([
    db.query.admissionItems.findMany({ orderBy: [asc(schema.admissionItems.sortOrder), asc(schema.admissionItems.seq)] }),
    getLocale(),
  ]);

  const clean = (vi: string | null, en: string | null) => {
    if (!vi) return null;
    const value = pickLocale(vi, en, locale);
    return hasPlaceholder(value) ? null : value;
  };

  const items = rows
    .filter((r) => !hasPlaceholder(r.title))
    .map((r) => ({
      id: r.id,
      type: r.type,
      title: pickLocale(r.title, r.titleEn, locale),
      detail: clean(r.detail, r.detailEn),
      meta: clean(r.meta, r.metaEn),
    }));

  const pick = (type: string): AdmissionInfoItem[] =>
    items.filter((i) => i.type === type).map(({ id, title, detail, meta }) => ({ id, title, detail, meta }));
  return { timeline: pick("timeline"), methods: pick("method"), documents: pick("document") };
}
