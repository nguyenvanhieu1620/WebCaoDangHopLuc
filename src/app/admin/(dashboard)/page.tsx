import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ khong_co_quyen?: string }>;
}) {
  const { khong_co_quyen } = await searchParams;
  const [
    allPosts,
    publishedPosts,
    newAdmissions,
    newContactMessages,
    newsletterSubscribers,
    recentPosts,
  ] = await Promise.all([
    db.query.posts.findMany(),
    db.query.posts.findMany({ where: eq(schema.posts.status, "published") }),
    db.query.admissionSubmissions.findMany({ where: eq(schema.admissionSubmissions.status, "new") }),
    db.query.contactMessages.findMany({ where: eq(schema.contactMessages.status, "new") }),
    db.query.newsletterSubscribers.findMany(),
    db.query.posts.findMany({ orderBy: desc(schema.posts.createdAt), limit: 5 }),
  ]);

  // Mỗi KPI trỏ thẳng tới nơi xử lý — bấm vào là tới việc cần làm ngay,
  // không phải tự đi tìm trong sidebar (đặc biệt quan trọng với 2 mục "mới"
  // cần admin xử lý sớm).
  const KPIS = [
    { label: "Bài viết đã đăng", value: String(publishedPosts.length), href: "/admin/bai-viet" },
    { label: "Tổng số bài viết", value: String(allPosts.length), href: "/admin/bai-viet" },
    { label: "Hồ sơ tuyển sinh mới", value: String(newAdmissions.length), href: "/admin/tuyen-sinh", highlight: newAdmissions.length > 0 },
    { label: "Tin nhắn liên hệ mới", value: String(newContactMessages.length), href: "/admin/lien-he", highlight: newContactMessages.length > 0 },
    { label: "Đăng ký nhận tin", value: String(newsletterSubscribers.length), href: "/admin/dang-ky-nhan-tin" },
  ];

  return (
    <div>
      <AdminTopbar title="Dashboard" description="Tổng quan hệ thống website" />
      {khong_co_quyen && (
        <div className="mx-8 mt-6 rounded-xl bg-accent-100 px-4 py-3 text-sm font-semibold text-accent-700">
          Tài khoản của bạn không có quyền truy cập mục vừa chọn.
        </div>
      )}
      <div className="flex items-center justify-end px-8 pt-6">
        <Link
          href="/admin/bai-viet"
          className="rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 px-4 py-2 text-[13px] font-bold text-white shadow-red"
        >
          + Viết bài mới
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 p-8 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`rounded-2xl border p-5 transition-colors ${
              k.highlight
                ? "border-accent-200 bg-accent-50 hover:border-accent-400"
                : "border-line bg-white hover:border-brand-500"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              {k.label}
            </span>
            <div
              className={`mt-2 font-display text-3xl font-bold ${k.highlight ? "text-accent-600" : "text-brand-900"}`}
            >
              {k.value}
            </div>
          </Link>
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
                <li key={p.id}>
                  <Link
                    href={`/admin/bai-viet?edit=${p.id}`}
                    className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-paper-alt"
                  >
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
