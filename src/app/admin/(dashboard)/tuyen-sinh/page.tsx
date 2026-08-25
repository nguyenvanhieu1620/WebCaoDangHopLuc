import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { updateAdmissionStatusAction, deleteAdmissionAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

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
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requirePermission("admissions-contact");
  const { q, status } = await searchParams;
  const activeStatus =
    status === "new" || status === "reviewed" || status === "contacted" ? status : "all";

  const allSubmissions = await db.query.admissionSubmissions.findMany({
    orderBy: desc(schema.admissionSubmissions.createdAt),
  });

  const submissions = allSubmissions.filter((s) => {
    if (activeStatus !== "all" && s.status !== activeStatus) return false;
    if (q) {
      const needle = q.toLowerCase();
      const haystack = `${s.fullName} ${s.phone} ${s.idNumber ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const buildFilterHref = (nextStatus: string) => {
    const params = new URLSearchParams();
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
      />
      <div className="p-8">
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
          <form action="/admin/tuyen-sinh" method="get" className="flex items-center gap-1.5">
            {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Tìm theo tên, SĐT, CCCD..."
              className="w-56 rounded-lg border border-line px-3 py-1.5 text-[12.5px] outline-none focus:border-brand-500"
            />
          </form>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {submissions.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              {allSubmissions.length === 0
                ? "Chưa có hồ sơ đăng ký nào."
                : "Không tìm thấy hồ sơ phù hợp với bộ lọc."}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-alt text-[11px] uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-6 py-3 font-semibold">Họ tên</th>
                  <th className="px-6 py-3 font-semibold">Điện thoại</th>
                  <th className="px-6 py-3 font-semibold">CCCD</th>
                  <th className="px-6 py-3 font-semibold">Ngành quan tâm</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 font-semibold">Cập nhật</th>
                  <th className="px-6 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-3.5 font-medium text-ink">{s.fullName}</td>
                    <td className="px-6 py-3.5 text-ink-soft">{s.phone}</td>
                    <td className="px-6 py-3.5 font-mono text-[12.5px] text-ink-soft">{s.idNumber ?? "—"}</td>
                    <td className="px-6 py-3.5 text-ink-soft">{s.program}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[s.status]}`}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1.5">
                        {(["new", "reviewed", "contacted"] as const).map((st) => (
                          <form
                            key={st}
                            action={async () => {
                              "use server";
                              await updateAdmissionStatusAction(s.id, st);
                            }}
                          >
                            <button
                              type="submit"
                              disabled={s.status === st}
                              className="rounded-md border border-line px-2 py-1 text-[10.5px] font-semibold text-ink-faint hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {STATUS_LABEL[st]}
                            </button>
                          </form>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <form
                        action={async () => {
                          "use server";
                          await deleteAdmissionAction(s.id);
                        }}
                      >
                        <ConfirmDeleteButton
                          className="rounded-md border border-line px-2.5 py-1 text-[10.5px] font-semibold text-accent-600 hover:border-accent-500"
                          confirmMessage={`Xoá hồ sơ của "${s.fullName}"? Không thể hoàn tác.`}
                        >
                          Xoá
                        </ConfirmDeleteButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
