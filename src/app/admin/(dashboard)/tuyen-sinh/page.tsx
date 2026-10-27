import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { updateAdmissionStatusAction, deleteAdmissionAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { formatDbDateTime } from "@/lib/utils";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { filterAdmissions, parseStatusFilter, parseDateFilter } from "./filter";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { paginate } from "@/lib/pagination";

export const metadata: Metadata = { title: "Đăng ký tuyển sinh" };

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  reviewed: "Đã xem",
  contacted: "Đã liên hệ",
};

const STATUS_CLASS: Record<string, string> = {
  new: "bg-accent-100 text-accent-700",
  reviewed: "bg-brand-100 text-brand-700",
  contacted: "bg-paper-alt text-ink-soft",
};

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới" },
  { key: "reviewed", label: "Đã xem" },
  { key: "contacted", label: "Đã liên hệ" },
] as const;

export default async function AdminAdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; program?: string; from?: string; to?: string }>;
}) {
  await requirePermission("admissions-contact");
  const { q, status, page, program, from: rawFrom, to: rawTo } = await searchParams;
  const from = parseDateFilter(rawFrom);
  const to = parseDateFilter(rawTo);
  const activeStatus = parseStatusFilter(status);

  const allSubmissions = await db.query.admissionSubmissions.findMany({
    orderBy: [desc(schema.admissionSubmissions.createdAt), desc(schema.admissionSubmissions.seq)],
  });

  const programOptions = [...new Set(allSubmissions.map((s) => s.program))].sort((a, b) => a.localeCompare(b, "vi"));
  const submissions = filterAdmissions(allSubmissions, { q, status: activeStatus, program, from, to });
  const pg = paginate(submissions, page);
  const exportParams = new URLSearchParams();
  if (activeStatus !== "all") exportParams.set("status", activeStatus);
  if (q) exportParams.set("q", q);
  if (program) exportParams.set("program", program);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  const exportQuery = exportParams.toString();
  const exportHref = `/admin/tuyen-sinh/xuat-csv${exportQuery ? `?${exportQuery}` : ""}`;

  const buildFilterHref = (nextStatus: string) => {
    const params = new URLSearchParams(exportParams);
    params.delete("status");
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/tuyen-sinh?${qs}` : "/admin/tuyen-sinh";
  };

  return (
    <div>
      <AdminTopbar
        title="Đăng ký tuyển sinh"
        description="Danh sách hồ sơ đăng ký xét tuyển từ website"
        actions={
          <a
            href={exportHref}
            download
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 px-3.5 text-sm font-semibold text-white shadow-blue"
          >
            <AdminIcon name="pages" className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất Excel ({submissions.length})</span>
            <span className="sm:hidden">Excel</span>
          </a>
        }
      />
      <div className="p-4 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <a
                key={f.key}
                href={buildFilterHref(f.key)}
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
          <form action="/admin/tuyen-sinh" method="get" className="flex w-full flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
            {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-ink-soft">Từ khoá<input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              aria-label="Tìm hồ sơ theo tên, số điện thoại hoặc CCCD"
              placeholder="Tìm theo tên, SĐT, CCCD..."
              className="w-full rounded-lg sm:w-56 border border-line px-3 py-1.5 text-[12.5px] outline-none focus:border-brand-500"
            /></label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">Ngành quan tâm
              <select name="program" defaultValue={program || ""} className="max-w-full rounded-lg border border-line px-3 py-1.5 text-sm"><option value="">Tất cả ngành</option>{programOptions.map((name) => <option key={name}>{name}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">Từ ngày<input type="date" name="from" defaultValue={from} className="rounded-lg border border-line px-3 py-1.5 text-sm" /></label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">Đến ngày<input type="date" name="to" defaultValue={to} min={from || undefined} className="rounded-lg border border-line px-3 py-1.5 text-sm" /></label>
            <button className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white">Lọc hồ sơ</button>
            <a href="/admin/tuyen-sinh" className="px-2 py-2 text-xs font-semibold text-brand-700 underline">Xoá bộ lọc</a>
          </form>
        </div>
        {submissions.length > 0 && (
          <p id="admissions-scroll-hint" className="mb-2 text-[12px] text-ink-faint 2xl:hidden">
            ↔ Cuộn ngang để xem đủ thông tin. Các nút cập nhật và xoá luôn nằm ngay dưới họ tên. Bấm &quot;Chi tiết&quot; để xem CCCD, email và ghi chú.
          </p>
        )}
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {submissions.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              {allSubmissions.length === 0
                ? "Chưa có hồ sơ đăng ký nào."
                : "Không tìm thấy hồ sơ phù hợp với bộ lọc."}
            </div>
          ) : (
            <div
              role="region"
              aria-label="Bảng hồ sơ đăng ký tuyển sinh, cuộn ngang để xem đủ cột"
              tabIndex={0}
              className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
            >
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-line bg-paper-alt text-[11px] uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-6 py-3 font-semibold">Họ tên</th>
                  <th className="px-6 py-3 font-semibold">Điện thoại</th>
                  <th className="px-6 py-3 font-semibold">Ngành quan tâm</th>
                  <th className="px-6 py-3 font-semibold">Ngày nộp</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pg.items.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="min-w-[240px] px-6 py-3.5">
                      <div className="font-medium text-ink">{s.fullName}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(["new", "reviewed", "contacted"] as const).map((st) => (
                          <form key={st} action={async () => { "use server"; await updateAdmissionStatusAction(s.id, st); }}>
                            <button disabled={s.status === st} aria-label={`Đánh dấu hồ sơ ${s.fullName}: ${STATUS_LABEL[st]}`} className="rounded-md border border-line px-2 py-1 text-[10.5px] font-semibold text-brand-700 disabled:opacity-40">{STATUS_LABEL[st]}</button>
                          </form>
                        ))}
                        <form action={async () => { "use server"; await deleteAdmissionAction(s.id); }}>
                          <ConfirmDeleteButton className="rounded-md border border-line px-2 py-1 text-[10.5px] font-semibold text-accent-600" confirmMessage={`Xoá hồ sơ của "${s.fullName}"? Không thể hoàn tác.`}>Xoá</ConfirmDeleteButton>
                        </form>
                      </div>
                      <details className="mt-1 text-[12px]">
                        <summary className="cursor-pointer select-none font-semibold text-brand-700 hover:underline">
                          Chi tiết
                        </summary>
                        <dl className="mt-2 w-60 space-y-1.5 rounded-lg bg-paper-alt p-3 text-ink-soft">
                          <div><dt className="font-semibold text-ink">CCCD</dt><dd>{s.idNumber || "—"}</dd></div>
                          <div>
                            <dt className="font-semibold text-ink">Email</dt>
                            <dd className="break-words">{s.email || "—"}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ink">Ghi chú</dt>
                            <dd className="whitespace-pre-line break-words">{s.note || "—"}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ink">Ngày nộp</dt>
                            <dd>{formatDbDateTime(s.createdAt)}</dd>
                          </div>
                        </dl>
                      </details>
                    </td>
                    <td className="px-6 py-3.5 text-ink-soft">{s.phone}</td>
                    <td className="px-6 py-3.5 text-ink-soft">{s.program}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-[12.5px] text-ink-soft">
                      {formatDbDateTime(s.createdAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[s.status]}`}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          <AdminPagination
            pagination={pg}
            basePath="/admin/tuyen-sinh"
            params={{ status: activeStatus === "all" ? undefined : activeStatus, q: q || undefined, program, from: from || undefined, to: to || undefined }}
            unit="hồ sơ"
          />
        </div>
      </div>
    </div>
  );
}
