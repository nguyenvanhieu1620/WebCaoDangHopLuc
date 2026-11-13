import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";
import { PAGE_BANNER_SLOTS, usesDefaultPageBanner } from "@/lib/constants";
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
  fallback?: { url: string; source: "default" | "disclosure" };
  saved: boolean;
  mediaImages: MediaOption[];
};

/** 1 thẻ = 1 form riêng: xem trước banner đang dùng + đổi/gỡ ảnh của đúng trang đó. */
function BannerCard({ kind, target, title, path, note, own, fallback, saved, mediaImages }: CardProps) {
  const shown = own || fallback?.url;
  const fallbackLabel = fallback?.source === "disclosure"
    ? "Ảnh mục Công khai"
    : fallback ? "Ảnh mặc định" : "Nền xanh";
  const status = own ? (kind === "default" ? "Ảnh mặc định" : "Ảnh riêng") : fallbackLabel;
  return (
    <div
      id={`banner-${kind}-${target || "main"}`}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition-shadow",
        saved ? "border-brand-500 shadow-md2 ring-2 ring-brand-100" : "border-line"
      )}
    >
      <div className="relative h-[140px] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600">
        {shown && <Image src={shown} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />}
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
          {saved ? `✓ Đã lưu · ${status}` : status}
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
              {kind === "default" ? "Gỡ ảnh mặc định" : `Gỡ ảnh riêng (dùng ${fallbackLabel.toLowerCase()})`}
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
    db.query.pageBanners.findMany({ orderBy: asc(schema.pageBanners.key) }),
    db.query.pages.findMany({ orderBy: [asc(schema.pages.slug), asc(schema.pages.seq)] }),
    db.query.mediaItems.findMany({ where: eq(schema.mediaItems.type, "image"), orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)] }),
  ]);
  const defaultUrl = settings?.pageBannerUrl ?? null;
  const ownBySlot = new Map(bannerRows.filter((row) => row.imageUrl).map((row) => [row.key, row.imageUrl]));
  const defaultBanner = defaultUrl ? { url: defaultUrl, source: "default" as const } : undefined;
  const disclosureUrl = ownBySlot.get("cong-khai");
  const disclosureBanner = disclosureUrl ? { url: disclosureUrl, source: "disclosure" as const } : undefined;
  const publicPages = pages
    .map((p) => ({ ...p, href: staticPageHref(p.slug) }))
    .filter((p): p is typeof p & { href: string } => !!p.href);
  const media = mediaImages.map(({ id, url, filename }) => ({ id, url, filename }));
  const customCount = [...ownBySlot.values()].filter(Boolean).length + publicPages.filter((p) => p.coverImageUrl).length;

  return (
    <div>
      <AdminTopbar
        title="Banner trang con"
        description={`Quản lý ảnh nền banner đầu trang con. ${customCount} trang đang có ảnh riêng.`}
      />
      <div className="space-y-10 p-5 sm:p-8">
        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-[13px] leading-relaxed text-brand-800">
          Ảnh riêng được ưu tiên. Khi chưa có ảnh riêng, nhãn trên thẻ cho biết trang đang dùng ảnh mặc định, ảnh mục Công khai hay nền xanh.
          Kích thước tham khảo nằm ngay dưới ô chọn ảnh.
        </div>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-faint">Ảnh mặc định</h2>
          <div className="max-w-xl">
            <BannerCard
              kind="default"
              target=""
              title="Ảnh mặc định cho trang con"
              note="Dùng cho các trang áp dụng ảnh mặc định khi chưa có ảnh riêng."
              own={defaultUrl}
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
                fallback={usesDefaultPageBanner(s.key) ? defaultBanner : undefined}
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
                  fallback={p.slug.startsWith("cong-khai-") ? disclosureBanner
                    : p.slug === "chinh-sach-bao-mat" ? undefined : defaultBanner}
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
