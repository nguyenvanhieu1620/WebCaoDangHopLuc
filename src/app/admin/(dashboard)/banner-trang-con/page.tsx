import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";
import { PAGE_BANNER_SLOTS } from "@/lib/constants";
import { cn, staticPageHref } from "@/lib/utils";
import { savePageBannerAction } from "./actions";

export const metadata: Metadata = { title: "Banner trang con" };

type MediaOption = { id: string; url: string; filename: string };

type CardProps = {
  kind: "default" | "slot" | "page";
  target: string;
  title: string;
  path?: string;
  note?: string;
  /** Ảnh riêng của thẻ này (null = chưa đặt). */
  own: string | null;
  /** Ảnh đang thực sự hiện trên web khi chưa có ảnh riêng (ảnh mặc định chung). */
  fallback: string | null;
  saved: boolean;
  mediaImages: MediaOption[];
};

/** 1 thẻ = 1 form riêng: xem trước banner đang dùng + đổi/gỡ ảnh của đúng trang đó. */
function BannerCard({ kind, target, title, path, note, own, fallback, saved, mediaImages }: CardProps) {
  const shown = own ?? fallback;
  const status = own ? "Ảnh riêng" : kind === "default" ? "Chưa đặt — nền xanh" : fallback ? "Đang dùng ảnh mặc định" : "Nền xanh mặc định";
  return (
    <div
      id={`banner-${kind}-${target || "main"}`}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition-shadow",
        saved ? "border-brand-500 shadow-md2 ring-2 ring-brand-100" : "border-line"
      )}
    >
      <div className="relative h-[140px] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600">
        {shown && <Image src={shown} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className={cn("object-cover", !own && "opacity-60 grayscale-[35%]")} />}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/70 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="truncate text-[15px] font-bold">{title}</div>
          {path && <div className="truncate font-mono text-[11px] text-white/70">{path}</div>}
        </div>
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-semibold",
            own ? "bg-accent-600 text-white" : "bg-white/85 text-ink-soft"
          )}
        >
          {saved ? "✓ Đã lưu" : status}
        </span>
      </div>
      <form action={savePageBannerAction} className="space-y-3 p-4">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="target" value={target} />
        {note && <p className="text-[11.5px] leading-relaxed text-ink-faint">{note}</p>}
        <ImagePicker spec="pageBanner" fileFieldName="image" pickedFieldName="imageExisting" images={mediaImages} currentUrl={own} hideCurrentPreview />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {own ? (
            <label className="flex items-center gap-2 text-[12px] text-ink-soft">
              <input type="checkbox" name="remove" className="h-4 w-4 rounded border-line" />
              {kind === "default" ? "Gỡ ảnh mặc định" : "Gỡ ảnh riêng (dùng ảnh mặc định)"}
            </label>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {path && (
              <a href={path} target="_blank" className="rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700">
                Xem trang ↗
              </a>
            )}
            <button type="submit" className="rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 px-4 py-2 text-[12.5px] font-bold text-white shadow-red">
              Lưu
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Banner đầu từng trang con (PageHero) — 1 chỗ quản lý mọi banner:
 * ảnh mặc định chung + từng trang chức năng (`PAGE_BANNER_SLOTS`) + từng trang tĩnh
 * có route công khai (ảnh bìa trang tĩnh, cùng field với admin/trang-tinh).
 * Trang cấu hình: lưu xong ở lại, thẻ vừa lưu được tô viền + cuộn tới.
 */
export default async function AdminPageBannersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requirePermission("page-banners");
  const { saved } = await searchParams;
  const [settings, bannerRows, pages, mediaImages] = await Promise.all([
    db.query.siteSettings.findFirst({ where: eq(schema.siteSettings.id, "main") }),
    db.query.pageBanners.findMany(),
    db.query.pages.findMany({ orderBy: asc(schema.pages.slug) }),
    db.query.mediaItems.findMany({ where: eq(schema.mediaItems.type, "image"), orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)] }),
  ]);
  const defaultUrl = settings?.pageBannerUrl ?? null;
  const ownBySlot = new Map(bannerRows.map((r) => [r.key, r.imageUrl]));
  const publicPages = pages
    .map((p) => ({ ...p, href: staticPageHref(p.slug) }))
    .filter((p): p is typeof p & { href: string } => !!p.href);
  const media = mediaImages.map(({ id, url, filename }) => ({ id, url, filename }));
  const customCount = [...ownBySlot.values()].filter(Boolean).length + publicPages.filter((p) => p.coverImageUrl).length;

  return (
    <div>
      <AdminTopbar
        title="Banner trang con"
        description={`Ảnh nền banner đầu từng trang — ${customCount} trang đang có ảnh riêng, các trang còn lại dùng ảnh mặc định`}
      />
      <div className="space-y-10 p-5 sm:p-8">
        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-[13px] leading-relaxed text-brand-800">
          <b>Thứ tự ưu tiên:</b> ảnh riêng của bài viết / sự kiện / ngành (nếu có) → ảnh riêng của trang ở đây → ảnh mặc định → nền
          xanh. Kích thước khuyến nghị và cảnh báo ảnh nhỏ hiện ngay dưới ô chọn ảnh của từng thẻ.
        </div>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-faint">Ảnh mặc định</h2>
          <div className="max-w-xl">
            <BannerCard
              kind="default"
              target=""
              title="Mọi trang chưa đặt ảnh riêng"
              note="Dùng cho mọi trang con chưa có ảnh riêng bên dưới. Để trống thì những trang đó dùng nền xanh gradient."
              own={defaultUrl}
              fallback={null}
              saved={saved === "default:"}
              mediaImages={media}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-faint">Trang chức năng</h2>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {PAGE_BANNER_SLOTS.map((s) => (
              <BannerCard
                key={s.key}
                kind="slot"
                target={s.key}
                title={s.label}
                path={s.path}
                note={"note" in s ? s.note : undefined}
                own={ownBySlot.get(s.key) ?? null}
                fallback={defaultUrl}
                saved={saved === `slot:${s.key}`}
                mediaImages={media}
              />
            ))}
          </div>
        </section>

        {publicPages.length > 0 && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-ink-faint">Trang tĩnh</h2>
            <p className="mb-3 text-[12px] text-ink-faint">Chính là ảnh bìa ở Trang tĩnh — đổi ở đây hay ở đó đều như nhau.</p>
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {publicPages.map((p) => (
                <BannerCard
                  key={p.id}
                  kind="page"
                  target={p.id}
                  title={p.title}
                  path={p.href}
                  own={p.coverImageUrl}
                  fallback={p.slug.startsWith("cong-khai-") ? ownBySlot.get("cong-khai") ?? defaultUrl : defaultUrl}
                  saved={saved === `page:${p.id}`}
                  mediaImages={media}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
