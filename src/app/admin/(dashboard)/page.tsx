import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { DailyBarChart, BreakdownBars, Sparkline, type DailyPoint } from "@/components/admin/DashboardCharts";
import { db, schema } from "@/lib/db";
import { count, desc, eq } from "drizzle-orm";
import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { cn, dbTimestampToISO, formatDbDateTime, hasPlaceholder, vnDateKey } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

type AdmissionLite = { createdAt: string; program: string };

/**
 * Gom hồ sơ theo ngày (giờ Việt Nam) cho 30 ngày gần nhất + so sánh 7 ngày
 * gần nhất với 7 ngày trước đó. Hàm thường bên ngoài component vì cần
 * `Date.now()` (rule react-hooks/purity — xem CLAUDE.md mục 5 "Sự kiện").
 */
function buildAdmissionStats(rows: AdmissionLite[]) {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = vnDateKey(dbTimestampToISO(r.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const daily: DailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const key = vnDateKey(new Date(now - i * DAY).toISOString());
    daily.push({ key, label: `${key.slice(8, 10)}/${key.slice(5, 7)}`, value: counts.get(key) ?? 0 });
  }
  const last7 = daily.slice(-7).reduce((s, p) => s + p.value, 0);
  const prev7 = daily.slice(-14, -7).reduce((s, p) => s + p.value, 0);
  return { daily, last7, prev7, last30: daily.reduce((s, p) => s + p.value, 0) };
}

function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }));
  return hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
}

function upcomingCount(events: { startAt: string }[]): number {
  const now = Date.now();
  return events.filter((e) => new Date(e.startAt).getTime() >= now).length;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ khong_co_quyen?: string }>;
}) {
  const user = await requireAdmin();
  const can = (key: string) => hasPermission(user, key);
  const canPosts = can("posts");
  const canAdmissions = can("admissions-contact");
  const { khong_co_quyen } = await searchParams;

  const [
    publishedPosts,
    draftPosts,
    recentPosts,
    admissions,
    newAdmissions,
    newMessages,
    subscribers,
    admissionInfo,
    pages,
    programs,
    banners,
    events,
  ] = await Promise.all([
    canPosts ? db.select({ value: count() }).from(schema.posts).where(eq(schema.posts.status, "published")) : [],
    canPosts ? db.select({ value: count() }).from(schema.posts).where(eq(schema.posts.status, "draft")) : [],
    canPosts
      ? db.query.posts.findMany({ columns: { id: true, title: true, status: true, updatedAt: true }, orderBy: desc(schema.posts.updatedAt), limit: 5 })
      : [],
    canAdmissions
      ? db.query.admissionSubmissions.findMany({ columns: { id: true, fullName: true, program: true, status: true, createdAt: true }, orderBy: desc(schema.admissionSubmissions.createdAt) })
      : [],
    canAdmissions ? db.select({ value: count() }).from(schema.admissionSubmissions).where(eq(schema.admissionSubmissions.status, "new")) : [],
    canAdmissions ? db.select({ value: count() }).from(schema.contactMessages).where(eq(schema.contactMessages.status, "new")) : [],
    canAdmissions ? db.select({ value: count() }).from(schema.newsletterSubscribers) : [],
    canAdmissions ? db.query.admissionItems.findMany({ columns: { title: true, detail: true, meta: true } }) : [],
    can("pages") ? db.query.pages.findMany({ columns: { content: true } }) : [],
    can("programs") ? db.query.programs.findMany({ columns: { tuition: true, content: true } }) : [],
    can("homepage") ? db.select({ value: count() }).from(schema.heroBanners) : [],
    can("events") ? db.query.events.findMany({ columns: { startAt: true } }) : [],
  ]);

  const stats = buildAdmissionStats(admissions);
  const trend = stats.last7 - stats.prev7;
  const newAdmissionCount = newAdmissions[0]?.value ?? 0;
  const newMessageCount = newMessages[0]?.value ?? 0;

  const byProgram = Object.entries(
    admissions.reduce<Record<string, number>>((acc, a) => {
      acc[a.program] = (acc[a.program] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const KPIS = [
    {
      label: "Hồ sơ 7 ngày qua",
      value: stats.last7,
      sub: trend === 0 ? "Bằng tuần trước" : `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend)} so với tuần trước`,
      subTone: trend > 0 ? "text-brand-700" : trend < 0 ? "text-accent-600" : "text-ink-faint",
      spark: stats.daily.slice(-14).map((p) => p.value),
      href: "/admin/tuyen-sinh",
      icon: "admissions-contact",
      visible: canAdmissions,
    },
    {
      label: "Hồ sơ chưa xử lý",
      value: newAdmissionCount,
      sub: newAdmissionCount ? "Cần liên hệ thí sinh" : "Đã xử lý hết",
      subTone: newAdmissionCount ? "text-accent-600" : "text-ink-faint",
      highlight: newAdmissionCount > 0,
      href: "/admin/tuyen-sinh?status=new",
      icon: "programs",
      visible: canAdmissions,
    },
    {
      label: "Tin nhắn mới",
      value: newMessageCount,
      sub: `${subscribers[0]?.value ?? 0} người nhận bản tin`,
      subTone: "text-ink-faint",
      highlight: newMessageCount > 0,
      href: "/admin/lien-he?status=new",
      icon: "testimonials",
      visible: canAdmissions,
    },
    {
      label: "Bài viết đã đăng",
      value: publishedPosts[0]?.value ?? 0,
      sub: `${draftPosts[0]?.value ?? 0} bản nháp`,
      subTone: "text-ink-faint",
      href: "/admin/bai-viet",
      icon: "posts",
      visible: canPosts,
    },
  ].filter((k) => k.visible);

  const pagesNeedFill = pages.filter((p) => hasPlaceholder(p.content)).length;
  const infoNeedFill = admissionInfo.filter((i) => hasPlaceholder(i.title) || hasPlaceholder(i.detail) || hasPlaceholder(i.meta)).length;
  const TODOS = [
    { show: canAdmissions && newAdmissionCount > 0, label: `${newAdmissionCount} hồ sơ tuyển sinh chưa xử lý`, href: "/admin/tuyen-sinh?status=new", tone: "accent" },
    { show: canAdmissions && newMessageCount > 0, label: `${newMessageCount} tin nhắn liên hệ chưa đọc`, href: "/admin/lien-he?status=new", tone: "accent" },
    { show: canPosts && (draftPosts[0]?.value ?? 0) > 0, label: `${draftPosts[0]?.value ?? 0} bài viết đang là bản nháp`, href: "/admin/bai-viet?status=draft", tone: "brand" },
    { show: pagesNeedFill > 0, label: `${pagesNeedFill} trang tĩnh còn nội dung "[Trường điền…]"`, href: "/admin/trang-tinh", tone: "brand" },
    { show: infoNeedFill > 0, label: `${infoNeedFill} mục thông tin tuyển sinh chưa điền`, href: "/admin/thong-tin-tuyen-sinh", tone: "brand" },
    { show: programs.some((p) => !p.tuition), label: `${programs.filter((p) => !p.tuition).length} ngành chưa nhập học phí (web đang hiện "Liên hệ")`, href: "/admin/nganh-dao-tao", tone: "brand" },
    { show: can("homepage") && (banners[0]?.value ?? 0) === 0, label: "Trang chủ chưa có ảnh banner thật (đang dùng hình 3D minh hoạ)", href: "/admin/banner-trang-chu", tone: "brand" },
  ].filter((t) => t.show);

  const upcoming = upcomingCount(events);

  return (
    <div>
      <AdminTopbar title="Dashboard" description="Tổng quan hệ thống website" />
      {khong_co_quyen && (
        <div className="mx-5 mt-6 rounded-xl bg-accent-100 px-4 py-3 text-sm font-semibold text-accent-700 sm:mx-8">
          Tài khoản của bạn không có quyền truy cập mục vừa chọn.
        </div>
      )}

      <div className="space-y-6 p-5 sm:p-8">
        {/* Lời chào + thao tác nhanh */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-7 py-7 text-white shadow-lg2">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent-500/30 blur-[60px]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-brand-500/40 blur-[60px]" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-brand-200">{todayLabel()}</div>
              <h2 className="mt-1.5 font-display text-[26px] font-semibold">
                {greeting()}, {user.name}
              </h2>
              <p className="mt-1 text-[13.5px] text-brand-100/90">
                {TODOS.length ? `Có ${TODOS.length} việc cần bạn xem hôm nay.` : "Mọi thứ đã gọn gàng — không có việc tồn đọng."}
                {upcoming > 0 && ` · ${upcoming} sự kiện sắp diễn ra.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {canPosts && (
                <Link href="/admin/bai-viet#form-bai-viet" className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-red">
                  <AdminIcon name="plus" className="h-4 w-4" /> Viết bài mới
                </Link>
              )}
              {canAdmissions && (
                <a href="/admin/tuyen-sinh/xuat-csv" download className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur hover:bg-white/20">
                  <AdminIcon name="pages" className="h-4 w-4" /> Xuất Excel hồ sơ
                </a>
              )}
            </div>
          </div>
        </div>

        {/* KPI */}
        {KPIS.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((k) => (
              <Link
                key={k.label}
                href={k.href}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md2",
                  k.highlight ? "border-accent-200 bg-accent-50" : "border-line bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{k.label}</span>
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", k.highlight ? "bg-accent-600 text-white" : "bg-brand-50 text-brand-700")}>
                    <AdminIcon name={k.icon} className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className={cn("font-display text-[34px] font-bold leading-none", k.highlight ? "text-accent-600" : "text-brand-900")}>
                    {k.value}
                  </div>
                  {"spark" in k && k.spark && <Sparkline values={k.spark} />}
                </div>
                <div className={cn("mt-2 text-[12px] font-semibold", k.subTone)}>{k.sub}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          {canAdmissions ? (
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-brand-900">Hồ sơ tuyển sinh 30 ngày gần nhất</h3>
                <span className="font-mono text-[11px] text-ink-faint">Tổng {stats.last30} hồ sơ · cột đỏ = hôm nay</span>
              </div>
              <DailyBarChart points={stats.daily} unit="hồ sơ" />
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-soft">
              Biểu đồ tuyển sinh chỉ hiện với tài khoản có quyền &quot;Tuyển sinh &amp; Liên hệ&quot;.
            </div>
          )}

          <div className="rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-brand-900">Việc cần xử lý</h3>
            {TODOS.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white">✓</span>
                Không có việc tồn đọng.
              </div>
            ) : (
              <ul className="space-y-2">
                {TODOS.map((t) => (
                  <li key={t.label}>
                    <Link
                      href={t.href}
                      className="group flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-[13px] font-medium text-ink transition-colors hover:border-brand-500 hover:bg-brand-50"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", t.tone === "accent" ? "dot-pulse bg-accent-500" : "bg-brand-500")} />
                      <span className="flex-1">{t.label}</span>
                      <span className="text-brand-700 transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {canAdmissions && (
            <div className="rounded-2xl border border-line bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-brand-900">Hồ sơ theo ngành</h3>
              {byProgram.length === 0 ? (
                <p className="text-sm text-ink-faint">Chưa có hồ sơ nào.</p>
              ) : (
                <BreakdownBars items={byProgram} />
              )}
              {admissions.length > 0 && (
                <div className="mt-6 border-t border-line pt-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">Mới nhất</div>
                  <ul className="space-y-2">
                    {admissions.slice(0, 3).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="truncate">
                          <span className="font-semibold text-ink">{a.fullName}</span>
                          <span className="text-ink-faint"> · {a.program}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-faint">{formatDbDateTime(a.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {canPosts && (
            <div className="rounded-2xl border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h3 className="text-sm font-semibold text-brand-900">Bài viết cập nhật gần đây</h3>
                <Link href="/admin/bai-viet" className="text-[12px] font-semibold text-brand-700 hover:underline">Tất cả →</Link>
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
                        className="flex items-center justify-between gap-3 px-6 py-3.5 transition-colors hover:bg-paper-alt"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{p.title}</span>
                          <span className="font-mono text-[11px] text-ink-faint">Cập nhật {formatDbDateTime(p.updatedAt)}</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            p.status === "published" ? "bg-brand-100 text-brand-700" : "bg-paper-alt text-ink-faint"
                          )}
                        >
                          {p.status === "published" ? "Đã đăng" : "Bản nháp"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!canPosts && !canAdmissions && (
            <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-soft">
              Dùng menu bên trái hoặc nhấn <kbd className="rounded border border-line px-1.5 font-mono text-[11px]">Ctrl K</kbd> để mở các mục bạn được cấp quyền.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
