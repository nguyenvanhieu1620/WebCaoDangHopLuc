import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getEvents } from "@/lib/data/events";
import { formatVNDateTime } from "@/lib/utils";
import type { Event } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Sự kiện" };

/** Tách sự kiện sắp diễn ra / đã diễn ra — hàm thường (không phải component) nên gọi Date.now() ở đây được. */
function splitUpcomingPast(allEvents: Event[]): { upcoming: Event[]; past: Event[] } {
  const now = Date.now();
  return {
    upcoming: allEvents.filter((e) => new Date(e.startAt).getTime() >= now),
    past: allEvents.filter((e) => new Date(e.startAt).getTime() < now).reverse(),
  };
}

export default async function EventsPage() {
  const allEvents = await getEvents();
  const { upcoming, past } = splitUpcomingPast(allEvents);

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-[1000px]">
        <SectionHeading
          eyebrow="Sự kiện"
          title="Sự kiện & hoạt động của trường"
          description="Ngày hội tư vấn, hội thảo, lễ tốt nghiệp và các hoạt động khác của nhà trường."
        />

        {allEvents.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có sự kiện nào — quản lý qua admin/su-kien.
          </div>
        ) : (
          <div className="space-y-12">
            {upcoming.length > 0 && (
              <div>
                <div className="mb-5 font-mono text-[11px] uppercase tracking-wider text-brand-700">
                  Sắp diễn ra
                </div>
                <div className="space-y-5">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div className="mb-5 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                  Đã diễn ra
                </div>
                <div className="space-y-5">
                  {past.map((e) => (
                    <EventCard key={e.id} event={e} muted />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function EventCard({
  event,
  muted,
}: {
  event: Awaited<ReturnType<typeof getEvents>>[number];
  muted?: boolean;
}) {
  const content = (
    <>
      <div className="relative h-[180px] shrink-0 sm:h-auto sm:w-[220px]">
        {event.coverImageUrl ? (
          <Image src={event.coverImageUrl} alt={event.title} fill className="object-cover" />
        ) : (
          <ImagePlaceholder label="Ảnh sự kiện" />
        )}
      </div>
      <div className="p-6">
        <div className="font-mono text-[11px] uppercase tracking-wider text-accent-600">
          {formatVNDateTime(event.startAt)}
          {event.location ? ` · ${event.location}` : ""}
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink">{event.title}</h3>
        {event.description && (
          <MarkdownContent content={event.description} className="mt-2.5 text-[14px]" />
        )}
        {event.slug && (
          <span className="mt-3 inline-block text-sm font-bold text-brand-700">Xem chi tiết →</span>
        )}
      </div>
    </>
  );
  const className = `overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 sm:flex ${
    muted ? "opacity-70" : "transition-transform hover:-translate-y-1"
  }`;

  return event.slug ? (
    <Link href={`/su-kien/${event.slug}`} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
