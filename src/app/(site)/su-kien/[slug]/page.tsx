import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
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

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/su-kien"
          className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          ← Sự kiện
        </Link>

        <Eyebrow tone="red" className="mb-6">
          {`${formatVNDateTime(event.startAt)}${event.location ? ` · ${event.location}` : ""}`}
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          {event.title}
        </h1>

        <div className="relative mt-8 h-[320px] overflow-hidden rounded-2xl">
          {event.coverImageUrl ? (
            <Image src={event.coverImageUrl} alt={event.title} fill className="object-cover" />
          ) : (
            <ImagePlaceholder label="Ảnh sự kiện" />
          )}
        </div>

        {event.description && <MarkdownContent content={event.description} className="mt-8" />}
      </div>
    </section>
  );
}
