import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { updateAdmissionStatusAction } from "./actions";

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

export default async function AdminAdmissionsPage() {
  const submissions = await db.query.admissionSubmissions.findMany({
    orderBy: desc(schema.admissionSubmissions.createdAt),
  });

  return (
    <div>
      <AdminTopbar
        title="Đăng ký tuyển sinh"
        description="Danh sách hồ sơ đăng ký xét tuyển từ website"
      />
      <div className="p-8">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {submissions.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có hồ sơ đăng ký nào.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-alt text-[11px] uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-6 py-3 font-semibold">Họ tên</th>
                  <th className="px-6 py-3 font-semibold">Điện thoại</th>
                  <th className="px-6 py-3 font-semibold">Ngành quan tâm</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 font-semibold">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-3.5 font-medium text-ink">{s.fullName}</td>
                    <td className="px-6 py-3.5 text-ink-soft">{s.phone}</td>
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
