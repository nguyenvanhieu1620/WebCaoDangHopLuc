import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
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

/** Ngày/tháng theo giờ Việt Nam cho ô lịch trên thẻ, VD { day: "05", month: "Th10" }. */
function vnDayMonth(iso: string): { day: string; month: string } {
  const parts = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).formatToParts(new Date(iso));
  return { day: parts.find((p) => p.type === "day")?.value ?? "", month: `Th${parts.find((p) => p.type === "month")?.value ?? ""}` };
}

export default async function EventsPage() {
  const allEvents = await getEvents();
  const { upcoming, past } = splitUpcomingPast(allEvents);

  return (
    <>
      <PageHero bannerKey="su-kien"
        crumbs={[{ label: "Sự kiện" }]}
        eyebrow="Lịch sự kiện"
        title="Sự kiện & hoạt động của trường"
        description="Ngày hội tư vấn, hội thảo, lễ tốt nghiệp và các hoạt động khác của nhà trường."
      />
      <DecorativeSection contentClassName="mx-auto max-w-[1000px]">
        {allEvents.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có sự kiện nào — quản lý qua admin/su-kien.
          </div>
        ) : (
          <div className="space-y-14">
            {upcoming.length > 0 && (
              <div>
                <GroupTitle tone="red">Sắp diễn ra</GroupTitle>
                <div className="space-y-5">
                  {upcoming.map((e, i) => (
                    <EventCard key={e.id} event={e} index={i} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <GroupTitle>Đã diễn ra</GroupTitle>
                <div className="space-y-5">
                  {past.map((e, i) => (
                    <EventCard key={e.id} event={e} index={i} muted />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DecorativeSection>
    </>
  );
}

function GroupTitle({ children, tone }: { children: string; tone?: "red" }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className={tone === "red" ? "h-6 w-1 rounded-full bg-accent-600" : "h-6 w-1 rounded-full bg-brand-900/20"} />
      <h2 className="font-display text-[22px] font-semibold text-brand-900">{children}</h2>
    </div>
  );
}

function EventCard({
  event,
  index,
  muted,
}: {
  event: Awaited<ReturnType<typeof getEvents>>[number];
  index: number;
  muted?: boolean;
}) {
  const date = vnDayMonth(event.startAt);
  const content = (
    <>
      <div className="img-reveal img-shine relative h-[190px] shrink-0 sm:h-auto sm:w-[260px]">
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, 260px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder label="Ảnh sự kiện" />
        )}
        <span className="absolute left-4 top-4 z-[4] flex h-14 w-12 flex-col items-center justify-center rounded-xl bg-white/95 text-center shadow-md2">
          <span className="font-display text-[20px] font-bold leading-none text-brand-900">{date.day}</span>
          <span className="mt-1 font-mono text-[9.5px] uppercase text-accent-600">{date.month}</span>
        </span>
      </div>
      <div className="p-6">
        <div className="font-mono text-[11px] uppercase tracking-wider text-accent-600">
          {formatVNDateTime(event.startAt)}
          {event.location ? ` · ${event.location}` : ""}
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink transition-colors group-hover:text-brand-700">{event.title}</h3>
        {event.description && (
          <MarkdownContent content={event.description} reveal={false} className="mt-2.5 line-clamp-3 text-[14px]" />
        )}
        {event.slug && (
          <span className="mt-3 inline-block text-sm font-bold text-brand-700">
            <span className="link-underline">Xem chi tiết</span> →
          </span>
        )}
      </div>
    </>
  );
  const className = `group block overflow-clip rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2 sm:flex ${
    muted ? "opacity-75 hover:opacity-100" : ""
  }`;

  return (
    <Reveal delay={Math.min(index, 4) * 70}>
      {event.slug ? (
        <Link href={`/su-kien/${event.slug}`} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </Reveal>
  );
}
