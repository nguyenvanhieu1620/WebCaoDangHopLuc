import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { updateSiteSettingsAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";
import { normalizeExternalUrl, normalizeZaloUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Cài đặt chung" };

export default async function AdminSiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; invalid?: string }>;
}) {
  await requirePermission("site-settings");
  const { saved, invalid } = await searchParams;
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
        {invalid && (
          <div role="alert" className="mb-5 max-w-2xl rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
            <b>⚠️ Link {invalid} không hợp lệ nên chưa được lưu</b> (vẫn giữ link cũ). Hãy dán
            nguyên địa chỉ trang, VD <code>https://www.facebook.com/ten-trang</code>.
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
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Mạng xã hội
            </div>
            <p className="mb-3 text-[12px] text-ink-faint">
              Dán nguyên địa chỉ trang (copy trên thanh địa chỉ trình duyệt). Để trống = ẩn nút đó trên web.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <LinkField name="facebookUrl" label="Facebook" value={settings.facebookUrl} placeholder="https://www.facebook.com/ten-trang" />
              <LinkField
                name="zaloUrl"
                label="Zalo"
                value={settings.zaloUrl}
                placeholder="https://zalo.me/… hoặc số điện thoại"
                normalize={normalizeZaloUrl}
              />
              <LinkField name="youtubeUrl" label="YouTube" value={settings.youtubeUrl} placeholder="https://www.youtube.com/@ten-kenh" />
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <LinkField
              name="lmsUrl"
              label="Link cổng LMS VNPT (để trống thì trang /lms hiện thông báo chưa cập nhật)"
              value={settings.lmsUrl}
              placeholder="https://lms.vnpt.vn/..."
            />
          </div>
          <div className="border-t border-line pt-4 text-[12.5px] text-ink-soft">
            Ảnh banner đầu các trang con (ảnh mặc định + ảnh riêng từng trang) quản lý ở{" "}
            <a href="/admin/banner-trang-con" className="font-semibold text-brand-700 hover:underline">
              Giao diện › Banner trang con →
            </a>
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

/**
 * Ô nhập link ngoài: không điền sẵn "#" (gõ nối sau "#" từng làm link Facebook hỏng thật), có
 * nút "Mở thử ↗" để admin bấm kiểm tra ngay, và báo khi link đang lưu đã được web tự sửa.
 */
function LinkField({
  name,
  label,
  value,
  placeholder,
  normalize = normalizeExternalUrl,
}: {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  normalize?: (raw: string) => string | null;
}) {
  const stored = value === "#" ? "" : value;
  const url = stored ? normalize(stored) : null;
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        inputMode="url"
        defaultValue={stored}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
      />
      {url ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px]">
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
            Mở thử ↗
          </a>
          {url.replace(/\/$/, "") !== stored.replace(/\/$/, "") && <span className="text-ink-faint">· web đang dùng link đã tự sửa</span>}
        </div>
      ) : (
        stored && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-700">⚠️ Không phải link hợp lệ — web đang ẩn nút này</p>
      )}
    </div>
  );
}
