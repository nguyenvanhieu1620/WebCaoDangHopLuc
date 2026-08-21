import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getSiteSettings } from "@/lib/data/site-settings";
import { updateSiteSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Cài đặt chung" };

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <AdminTopbar
        title="Cài đặt chung"
        description="Thông tin liên hệ & banner thông báo hiển thị ở Header/Footer toàn site"
      />
      <div className="p-8">
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
