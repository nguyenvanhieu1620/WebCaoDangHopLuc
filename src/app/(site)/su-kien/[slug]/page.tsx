import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { Button } from "@/components/ui/Button";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getEventBySlug } from "@/lib/data/events";
import { formatVNDateTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event ? event.title : "Sự kiện" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const facts = [
    { label: "Bắt đầu", value: formatVNDateTime(event.startAt) },
    event.endAt ? { label: "Kết thúc", value: formatVNDateTime(event.endAt) } : null,
    event.location ? { label: "Địa điểm", value: event.location } : null,
  ].filter((f): f is { label: string; value: string } => !!f);

  return (
    <>
      <PageHero bannerKey="su-kien"
        crumbs={[{ label: "Sự kiện", href: "/su-kien" }, { label: event.title }]}
        eyebrow="Sự kiện"
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
            <p className="text-[15px] text-ink-faint">Thông tin chi tiết về sự kiện đang được cập nhật.</p>
          )}
        </div>
        <aside className="h-fit rounded-[22px] border border-line bg-white p-6 shadow-sm2 lg:sticky lg:top-28">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Thông tin sự kiện</div>
          <dl className="mt-4 divide-y divide-line border-y border-line text-[14px]">
            {facts.map((f) => (
              <div key={f.label} className="py-3">
                <dt className="text-ink-faint">{f.label}</dt>
                <dd className="mt-0.5 font-semibold text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
          <Button href="/su-kien" variant="outline" className="mt-6 w-full justify-center">
            ← Tất cả sự kiện
          </Button>
        </aside>
      </DecorativeSection>
    </>
  );
}
