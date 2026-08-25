import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { updateSiteSettingsAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Cài đặt chung" };

export default async function AdminSiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requirePermission("site-settings");
  const { saved } = await searchParams;
  const settings = await db.query.siteSettings.findFirst({
    where: eq(schema.siteSettings.id, "main"),
  });
  if (!settings) {
    throw new Error("Chưa có dữ liệu site_settings — chạy `npm run db:seed` trước.");
  }

  return (
    <div>
      <AdminTopbar
        title="Cài đặt chung"
        description="Thông tin liên hệ & banner thông báo hiển thị ở Header/Footer toàn site"
      />
      <div className="p-8">
        {saved && (
          <div className="mb-5 max-w-2xl rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            ✓ Đã lưu thay đổi thành công.
          </div>
        )}
        <form
          action={updateSiteSettingsAction}
          className="max-w-2xl space-y-4 rounded-2xl border border-line bg-white p-6"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Banner thông báo (thanh chạy trên cùng Header)
            </label>
            <input
              name="announcement"
              required
              defaultValue={settings.announcement}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <details className="mt-2 rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3">
                <AutoTranslateButton
                  pairs={[{ viName: "announcement", enName: "announcementEn" }]}
                />
              </div>
              <input
                name="announcementEn"
                defaultValue={settings.announcementEn ?? ""}
                placeholder="Announcement banner (English)"
                className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </details>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Hotline</label>
              <input
                name="hotline"
                required
                defaultValue={settings.hotline}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Email</label>
              <input
                name="email"
                type="email"
                required
                defaultValue={settings.email}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Địa chỉ</label>
            <input
              name="address"
              required
              defaultValue={settings.address}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="border-t border-line pt-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Mạng xã hội (để trống = &quot;#&quot;)
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Facebook</label>
                <input
                  name="facebookUrl"
                  defaultValue={settings.facebookUrl}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Zalo</label>
                <input
                  name="zaloUrl"
                  defaultValue={settings.zaloUrl}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">YouTube</label>
                <input
                  name="youtubeUrl"
                  defaultValue={settings.youtubeUrl}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Link cổng LMS VNPT (để trống = &quot;#&quot;, trang /lms sẽ hiện thông báo chưa cập nhật)
            </label>
            <input
              name="lmsUrl"
              defaultValue={settings.lmsUrl}
              placeholder="https://lms.vnpt.vn/..."
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-red"
          >
            Lưu cài đặt
          </button>
        </form>
      </div>
    </div>
  );
}
