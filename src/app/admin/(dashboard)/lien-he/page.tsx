import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { formatVNDateTime } from "@/lib/utils";
import { markContactMessageAction, deleteContactMessageAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Tin nhắn liên hệ" };

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới" },
  { key: "read", label: "Đã xem" },
] as const;

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("admissions-contact");
  const { status } = await searchParams;
  const activeStatus = status === "new" || status === "read" ? status : "all";

  const allMessages = await db.query.contactMessages.findMany({
    orderBy: desc(schema.contactMessages.createdAt),
  });
  const messages = allMessages.filter((m) => activeStatus === "all" || m.status === activeStatus);

  return (
    <div>
      <AdminTopbar
        title="Tin nhắn liên hệ"
        description="Câu hỏi gửi từ form Liên hệ trên website công khai"
      />
      <div className="p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <a
              key={f.key}
              href={f.key === "all" ? "/admin/lien-he" : `/admin/lien-he?status=${f.key}`}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                activeStatus === f.key
                  ? "bg-brand-700 text-white"
                  : "border border-line text-ink-soft hover:border-brand-500"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {messages.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              {allMessages.length === 0
                ? "Chưa có tin nhắn liên hệ nào."
                : "Không có tin nhắn phù hợp với bộ lọc."}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {messages.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{m.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          m.status === "new"
                            ? "bg-accent-100 text-accent-700"
                            : "bg-paper-alt text-ink-faint"
                        }`}
                      >
                        {m.status === "new" ? "Mới" : "Đã xem"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-faint">
                      {[m.phone, m.email].filter(Boolean).join(" · ") || "Không có SĐT/email"} ·{" "}
                      {formatVNDateTime(m.createdAt)}
                    </div>
                    <p className="mt-2 max-w-2xl text-[13.5px] text-ink-soft">{m.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await markContactMessageAction(m.id, m.status === "new" ? "read" : "new");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                      >
                        {m.status === "new" ? "Đánh dấu đã xem" : "Đánh dấu chưa xem"}
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await deleteContactMessageAction(m.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá tin nhắn của "${m.name}"? Không thể hoàn tác.`}
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
      </div>
    </div>
  );
}
