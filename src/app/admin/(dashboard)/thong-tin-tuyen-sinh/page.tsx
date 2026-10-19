import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";
import { cn, hasPlaceholder } from "@/lib/utils";
import { paginate } from "@/lib/pagination";
import { deleteAdmissionItemAction } from "./actions";
import { SECTIONS, sectionType } from "./form";

export const metadata: Metadata = { title: "Thông tin tuyển sinh" };

const needsFill = (i: { title: string; detail: string | null; meta: string | null }) =>
  hasPlaceholder(i.title) || hasPlaceholder(i.detail) || hasPlaceholder(i.meta);

/** 3 nhóm (Mốc thời gian / Phương thức / Hồ sơ) thành 3 tab `?type=`; mỗi tab 1 danh sách có phân trang. */
export default async function AdminAdmissionInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; saved?: string }>;
}) {
  await requirePermission("admissions-contact");
  const sp = await searchParams;
  const type = sectionType(sp.type);
  const section = SECTIONS.find((s) => s.type === type)!;
  const all = await db.query.admissionItems.findMany({ orderBy: [asc(schema.admissionItems.sortOrder), asc(schema.admissionItems.seq)] });
  const items = all.filter((i) => i.type === type);
  const placeholderCount = all.filter(needsFill).length;
  const pg = paginate(items, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Thông tin tuyển sinh"
        description="Mốc thời gian, phương thức và hồ sơ hiển thị ở trang /tuyen-sinh"
        actions={<AdminNewButton href={`/admin/thong-tin-tuyen-sinh/them-moi?type=${type}`} />}
      />
      <div className="space-y-5 p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        {placeholderCount > 0 && (
          <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-[13px] text-accent-700">
            ⚠️ Có <strong>{placeholderCount}</strong> mục còn ghi chú dạng <code>[Trường điền: …]</code>. Web công khai tạm hiện
            &quot;Đang cập nhật&quot; ở các chỗ này — hãy điền thông tin thật trước khi công bố tuyển sinh.
          </div>
        )}
        <nav aria-label="Nhóm thông tin" className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            const n = all.filter((i) => i.type === s.type).length;
            return (
              <Link
                key={s.type}
                href={`/admin/thong-tin-tuyen-sinh?type=${s.type}`}
                aria-current={s.type === type ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                  s.type === type ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700"
                )}
              >
                {s.title} ({n})
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4">
            <div className="text-sm font-semibold text-brand-900">
              {section.title} ({items.length})
            </div>
            <div className="mt-0.5 text-[12px] text-ink-faint">{section.hint}</div>
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có mục nào — nhóm này sẽ được ẩn trên web.{" "}
              <Link href={`/admin/thong-tin-tuyen-sinh/them-moi?type=${type}`} className="font-semibold text-brand-700 hover:underline">
                Thêm mục đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      <Link href={`/admin/thong-tin-tuyen-sinh/${item.id}`} className="truncate hover:text-brand-700">
                        <span className="font-mono text-[11px] text-ink-faint">#{item.sortOrder}</span> {item.title}
                      </Link>
                      {needsFill(item) && (
                        <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[10.5px] font-semibold text-accent-700">⚠️ Chưa điền</span>
                      )}
                    </div>
                    {(item.meta || item.detail) && (
                      <div className="mt-0.5 truncate text-[12px] text-ink-faint">{[item.meta, item.detail].filter(Boolean).join(" — ")}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/thong-tin-tuyen-sinh/${item.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteAdmissionItemAction(item.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá "${item.title}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/thong-tin-tuyen-sinh" params={{ type }} unit="mục" />
        </div>
      </div>
    </div>
  );
}
