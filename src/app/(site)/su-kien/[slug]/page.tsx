import { formatSiteDate } from "@/lib/site-copy";
import { pageText } from "@/lib/page-copy";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { Button } from "@/components/ui/Button";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getEventBySlug } from "@/lib/data/events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const copy = pageText(locale);
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event ? event.title : copy("Sự kiện") };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const copy = pageText(locale);
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const facts = [
    { label: copy("Bắt đầu"), value: formatSiteDate(event.startAt, locale, true) },
    event.endAt ? { label: copy("Kết thúc"), value: formatSiteDate(event.endAt, locale, true) } : null,
    event.location ? { label: copy("Địa điểm"), value: event.location } : null,
  ].filter((f): f is { label: string; value: string } => !!f);

  return (
    <>
      <PageHero bannerKey="su-kien"
        crumbs={[{ label: copy("Sự kiện"), href: "/su-kien" }, { label: event.title }]}
        eyebrow={copy("Sự kiện")}
        title={event.title}
        imageUrl={event.coverImageUrl}
        variant="article"
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-wider text-white/80">
          {facts.map((f) => (
            <span key={f.label}>
              <span className="text-accent-400">{f.label}:</span> {f.value}
            </span>
          ))}
        </div>
      </PageHero>
      <DecorativeSection contentClassName="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div className="min-w-0">
          {event.description ? (
            <MarkdownContent content={event.description} />
          ) : (
            <p className="text-[15px] text-ink-faint">{copy("Thông tin chi tiết về sự kiện đang được cập nhật.")}</p>
          )}
        </div>
        <aside className="h-fit rounded-[22px] border border-line bg-white p-6 shadow-sm2 lg:sticky lg:top-32">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">{copy("Thông tin sự kiện")}</div>
          <dl className="mt-4 divide-y divide-line border-y border-line text-[14px]">
            {facts.map((f) => (
              <div key={f.label} className="py-3">
                <dt className="text-ink-faint">{f.label}</dt>
                <dd className="mt-0.5 font-semibold text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
          <Button href={`/lien-he?chuDe=${encodeURIComponent(event.title)}`} className="mt-6 w-full justify-center">{copy("Liên hệ về sự kiện →")}</Button>
          <Button href="/su-kien" variant="outline" className="mt-6 w-full justify-center">
            {copy("← Tất cả sự kiện")}
          </Button>
        </aside>
      </DecorativeSection>
    </>
  );
}
