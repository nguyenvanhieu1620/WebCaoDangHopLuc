import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import type { AdmissionSubmission } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { updateAdmissionStatusAction, deleteAdmissionAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { formatDbDateTime } from "@/lib/utils";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { filterAdmissions, parseStatusFilter, parseDateFilter } from "./filter";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { paginate } from "@/lib/pagination";
import { normalizeVnPhone } from "@/lib/validate";

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

function AdmissionStatus({ status }: { status: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[status] ?? "bg-paper-alt text-ink-soft"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function AdmissionActions({ submission }: { submission: AdmissionSubmission }) {
  const buttonClass = "min-h-11 rounded-md border border-line px-2 py-1 text-xs font-semibold lg:min-h-0 lg:text-[10.5px]";

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {(["new", "reviewed", "contacted"] as const).map((status) => (
        <form key={status} action={updateAdmissionStatusAction.bind(null, submission.id, status)}>
          <button
            disabled={submission.status === status}
            aria-label={`Đánh dấu hồ sơ ${submission.fullName}: ${STATUS_LABEL[status]}`}
            className={`${buttonClass} text-brand-700 disabled:opacity-40`}
          >
            {STATUS_LABEL[status]}
          </button>
        </form>
      ))}
      <form action={deleteAdmissionAction.bind(null, submission.id)}>
        <ConfirmDeleteButton
          className={`${buttonClass} text-accent-600`}
          confirmMessage={`Xoá hồ sơ của "${submission.fullName}"? Không thể hoàn tác.`}
        >
          Xoá
        </ConfirmDeleteButton>
      </form>
    </div>
  );
}

function AdmissionDetails({ submission }: { submission: AdmissionSubmission }) {
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer select-none py-2 font-semibold text-brand-700 hover:underline lg:py-0">
        Chi tiết
      </summary>
      <dl className="mt-2 space-y-1.5 rounded-lg bg-paper-alt p-3 text-ink-soft [overflow-wrap:anywhere] lg:w-60">
        <div><dt className="font-semibold text-ink">CCCD</dt><dd>{submission.idNumber || "—"}</dd></div>
        <div><dt className="font-semibold text-ink">Email</dt><dd>{submission.email || "—"}</dd></div>
        <div><dt className="font-semibold text-ink">Ghi chú</dt><dd className="whitespace-pre-line">{submission.note || "—"}</dd></div>
        <div><dt className="font-semibold text-ink">Ngày nộp</dt><dd>{formatDbDateTime(submission.createdAt)}</dd></div>
      </dl>
    </details>
  );
}

function AdmissionCard({ submission }: { submission: AdmissionSubmission }) {
  const dialNumber = normalizeVnPhone(submission.phone);

  return (
    <li className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 text-sm font-semibold text-ink [overflow-wrap:anywhere]">{submission.fullName}</h2>
        <AdmissionStatus status={submission.status} />
      </div>
      <p className="mt-1 text-xs text-ink-soft [overflow-wrap:anywhere]">{submission.program}</p>
      {/^\+?[0-9]+$/.test(dialNumber) ? (
        <a href={`tel:${dialNumber}`} className="mt-3 inline-flex min-h-11 max-w-full items-center rounded-lg bg-brand-50 px-3 text-sm font-semibold text-brand-700">
          <span className="[overflow-wrap:anywhere]">Gọi {submission.phone}</span>
        </a>
      ) : (
        <p className="mt-3 text-sm text-ink-soft [overflow-wrap:anywhere]">{submission.phone || "—"}</p>
      )}
      <AdmissionActions submission={submission} />
      <AdmissionDetails submission={submission} />
    </li>
  );
}

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
          <form action="/admin/tuyen-sinh" method="get" className="grid w-full grid-cols-2 items-end gap-3 rounded-xl border border-line bg-white p-4 sm:flex sm:flex-wrap">
            {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
            <label className="col-span-2 flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-ink-soft">Từ khoá<input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              aria-label="Tìm hồ sơ theo tên, số điện thoại hoặc CCCD"
              placeholder="Tìm theo tên, SĐT, CCCD..."
              className="w-full rounded-lg sm:w-56 border border-line px-3 py-1.5 text-[12.5px] outline-none focus:border-brand-500"
            /></label>
            <label className="col-span-2 flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft">Ngành quan tâm
              <select name="program" defaultValue={program || ""} className="max-w-full rounded-lg border border-line px-3 py-1.5 text-sm"><option value="">Tất cả ngành</option>{programOptions.map((name) => <option key={name}>{name}</option>)}</select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft">Từ ngày<input type="date" name="from" defaultValue={from} className="min-w-0 rounded-lg border border-line px-2 py-1.5 text-sm sm:px-3" /></label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft">Đến ngày<input type="date" name="to" defaultValue={to} min={from || undefined} className="min-w-0 rounded-lg border border-line px-2 py-1.5 text-sm sm:px-3" /></label>
            <button className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white">Lọc hồ sơ</button>
            <a href="/admin/tuyen-sinh" className="px-2 py-2 text-xs font-semibold text-brand-700 underline">Xoá bộ lọc</a>
          </form>
        </div>
        {submissions.length > 0 && (
          <p id="admissions-scroll-hint" className="mb-2 hidden text-[12px] text-ink-faint lg:block 2xl:hidden">
            ↔ Cuộn ngang để xem đủ thông tin. Các nút cập nhật và xoá luôn nằm ngay dưới họ tên. Bấm &quot;Chi tiết&quot; để xem CCCD, email và ghi chú.
          </p>
        )}
        <div className="lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line lg:bg-white">
          {submissions.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint lg:border-0">
              {allSubmissions.length === 0
                ? "Chưa có hồ sơ đăng ký nào."
                : "Không tìm thấy hồ sơ phù hợp với bộ lọc."}
            </div>
          ) : (
            <>
              <ul aria-label="Danh sách hồ sơ đăng ký tuyển sinh" className="mb-3 space-y-3 lg:hidden">
                {pg.items.map((submission) => <AdmissionCard key={submission.id} submission={submission} />)}
              </ul>
              <div
                role="region"
                aria-label="Bảng hồ sơ đăng ký tuyển sinh, cuộn ngang để xem đủ cột"
                tabIndex={0}
                className="hidden overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 lg:block"
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
                    {pg.items.map((submission) => (
                      <tr key={submission.id} className="align-top">
                        <td className="min-w-[240px] px-6 py-3.5">
                          <div className="font-medium text-ink">{submission.fullName}</div>
                          <AdmissionActions submission={submission} />
                          <AdmissionDetails submission={submission} />
                        </td>
                        <td className="px-6 py-3.5 text-ink-soft">{submission.phone}</td>
                        <td className="px-6 py-3.5 text-ink-soft">{submission.program}</td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-[12.5px] text-ink-soft">
                          {formatDbDateTime(submission.createdAt)}
                        </td>
                        <td className="px-6 py-3.5"><AdmissionStatus status={submission.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
