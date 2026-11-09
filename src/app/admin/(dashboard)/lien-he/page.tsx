import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { formatDbDateTime } from "@/lib/utils";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { markContactMessageAction, deleteContactMessageAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { paginate } from "@/lib/pagination";
import { isValidEmail, normalizeVnPhone } from "@/lib/validate";
import { filterContactMessages, parseContactFilters } from "./filter";

export const metadata: Metadata = { title: "Tin nhắn liên hệ" };

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới" },
  { key: "read", label: "Đã xem" },
] as const;

const contactLinkClass =
  "inline-flex min-h-11 items-center rounded-lg bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 sm:min-h-0 sm:py-2";

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; status?: string | string[]; page?: string | string[] }>;
}) {
  await requirePermission("admissions-contact");
  const params = await searchParams;
  const filters = parseContactFilters(params);
  const { q, status: activeStatus } = filters;

  const allMessages = await db.query.contactMessages.findMany({
    orderBy: [desc(schema.contactMessages.createdAt), desc(schema.contactMessages.seq)],
  });
  const messages = filterContactMessages(allMessages, filters);
  const pg = paginate(messages, params.page);

  function filterQuery(status: typeof activeStatus, query: string) {
    const search = new URLSearchParams();
    if (status !== "all") search.set("status", status);
    if (query) search.set("q", query);
    const encoded = search.toString();
    return encoded ? `?${encoded}` : "";
  }

  return (
    <div>
      <AdminTopbar
        title="Tin nhắn liên hệ"
        description="Câu hỏi gửi từ form Liên hệ trên website công khai"
        actions={
          <a
            href={`/admin/lien-he/xuat-csv${filterQuery(activeStatus, q)}`}
            download
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 px-3.5 text-sm font-semibold text-white shadow-blue"
          >
            <AdminIcon name="pages" className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất Excel ({messages.length})</span>
            <span className="sm:hidden">Excel</span>
          </a>
        }
      />
      <div className="p-4 sm:p-8">
        <form
          role="search"
          action="/admin/lien-he"
          method="get"
          className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3"
        >
          {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
          <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft sm:w-auto sm:flex-1">
            Tìm theo tên, số điện thoại hoặc email
            <input
              key={q}
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nhập từ khóa"
              className="min-h-11 w-full rounded-lg border border-line px-3 text-sm font-normal outline-none focus:border-brand-500"
            />
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-brand-700 px-4 text-xs font-semibold text-white">
            Tìm tin nhắn
          </button>
          {q && (
            <a href={`/admin/lien-he${filterQuery(activeStatus, "")}`} className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-brand-700 underline">
              Xoá từ khóa
            </a>
          )}
        </form>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/admin/lien-he${filterQuery(f.key, q)}`}
              aria-current={activeStatus === f.key ? "page" : undefined}
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
              {pg.items.map((m) => {
                const phone = normalizeVnPhone(m.phone ?? "");
                const canCall = /^\+?[0-9]+$/.test(phone);
                const email = m.email?.trim() ?? "";
                const canReply = isValidEmail(email) && !/[<>,;:"\\]/.test(email);

                return (
                  <li key={m.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6">
                    <div className="min-w-0 [overflow-wrap:anywhere]">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="min-w-0 text-sm font-semibold text-ink">{m.name}</h2>
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
                        {formatDbDateTime(m.createdAt)}
                      </div>
                      <p className="mt-2 max-w-2xl whitespace-pre-wrap text-[13.5px] text-ink-soft">{m.message}</p>
                      {(canCall || canReply) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canCall && (
                            <a href={`tel:${phone}`} className={contactLinkClass} aria-label={`Gọi ${m.phone}`}>
                              Gọi
                            </a>
                          )}
                          {canReply && (
                            <a href={`mailto:${encodeURIComponent(email).replace("%40", "@")}`} className={contactLinkClass}>
                              Trả lời qua email
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await markContactMessageAction(m.id, m.status === "new" ? "read" : "new");
                        }}
                      >
                        <button
                          type="submit"
                          className="min-h-11 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700 sm:min-h-0"
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
                          className="min-h-11 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500 sm:min-h-0"
                          confirmMessage={`Xoá tin nhắn của "${m.name}"? Không thể hoàn tác.`}
                        >
                          Xoá
                        </ConfirmDeleteButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <AdminPagination
            pagination={pg}
            basePath="/admin/lien-he"
            params={{ status: activeStatus === "all" ? undefined : activeStatus, q: q || undefined }}
            unit="tin nhắn"
          />
        </div>
      </div>
    </div>
  );
}
