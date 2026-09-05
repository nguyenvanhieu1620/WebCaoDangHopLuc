import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { CopyEmailsButton } from "@/components/admin/CopyEmailsButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { formatVNDateTime } from "@/lib/utils";
import { deleteNewsletterSubscriberAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Đăng ký nhận tin" };

export default async function AdminNewsletterPage() {
  await requirePermission("admissions-contact");

  const subscribers = await db.query.newsletterSubscribers.findMany({
    orderBy: desc(schema.newsletterSubscribers.createdAt),
  });

  return (
    <div>
      <AdminTopbar
        title="Đăng ký nhận tin"
        description="Email đăng ký nhận bản tin qua form ở Footer website"
      />
      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-900">
            Danh sách ({subscribers.length})
          </span>
          {subscribers.length > 0 && (
            <CopyEmailsButton emails={subscribers.map((s) => s.email)} />
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {subscribers.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có ai đăng ký nhận tin.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {subscribers.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{s.email}</div>
                    <div className="text-[11.5px] text-ink-faint">{formatVNDateTime(s.createdAt)}</div>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteNewsletterSubscriberAction(s.id);
                    }}
                  >
                    <ConfirmDeleteButton
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                      confirmMessage={`Xoá email "${s.email}"? Không thể hoàn tác.`}
                    >
                      Xoá
                    </ConfirmDeleteButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
