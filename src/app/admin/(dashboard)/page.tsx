import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [allPosts, publishedPosts, newAdmissions, recentPosts] = await Promise.all([
    db.query.posts.findMany(),
    db.query.posts.findMany({ where: eq(schema.posts.status, "published") }),
    db.query.admissionSubmissions.findMany({ where: eq(schema.admissionSubmissions.status, "new") }),
    db.query.posts.findMany({ orderBy: desc(schema.posts.createdAt), limit: 5 }),
  ]);

  const KPIS = [
    { label: "Bài viết đã đăng", value: String(publishedPosts.length) },
    { label: "Tổng số bài viết", value: String(allPosts.length) },
    { label: "Hồ sơ tuyển sinh mới", value: String(newAdmissions.length) },
  ];

  return (
    <div>
      <AdminTopbar title="Dashboard" description="Tổng quan hệ thống website" />
      <div className="grid grid-cols-1 gap-5 p-8 sm:grid-cols-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-white p-5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              {k.label}
            </span>
            <div className="mt-2 font-display text-3xl font-bold text-brand-900">
              {k.value}
            </div>
          </div>
        ))}
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4 text-sm font-semibold text-brand-900">
            Bài viết gần đây
          </div>
          {recentPosts.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-faint">
              Chưa có bài viết nào — vào mục &quot;Bài viết&quot; để tạo mới.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recentPosts.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-sm font-medium text-ink">{p.title}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      p.status === "published"
                        ? "bg-brand-100 text-brand-700"
                        : "bg-paper-alt text-ink-faint"
                    }`}
                  >
                    {p.status === "published" ? "Đã đăng" : "Bản nháp"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
