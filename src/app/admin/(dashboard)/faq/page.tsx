import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminNewButton, SavedNotice } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { paginate } from "@/lib/pagination";
import { deleteFaqAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Câu hỏi thường gặp" };

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  await requirePermission("faq");
  const sp = await searchParams;
  const allFaqs = await db.query.faqs.findMany({ orderBy: [asc(schema.faqs.sortOrder), asc(schema.faqs.seq)] });
  const pg = paginate(allFaqs, sp.page);

  return (
    <div>
      <AdminTopbar
        title="Câu hỏi thường gặp"
        description="Danh sách FAQ hiển thị ở /faq — vị trí càng nhỏ hiện càng trước"
        actions={<AdminNewButton href="/admin/faq/them-moi" />}
      />
      <div className="p-5 sm:p-8">
        <SavedNotice show={sp.saved === "1"} />
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">Danh sách ({allFaqs.length})</div>
          {allFaqs.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có câu hỏi nào.{" "}
              <Link href="/admin/faq/them-moi" className="font-semibold text-brand-700 hover:underline">
                Thêm câu hỏi đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {pg.items.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <Link href={`/admin/faq/${f.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                      <span className="font-mono text-[11px] text-ink-faint">#{f.sortOrder}</span> {f.question}
                    </Link>
                    <div className="mt-0.5 truncate text-[12px] text-ink-faint">{f.answer}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/faq/${f.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteFaqAction(f.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá câu hỏi "${f.question}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination pagination={pg} basePath="/admin/faq" unit="câu hỏi" />
        </div>
      </div>
    </div>
  );
}
