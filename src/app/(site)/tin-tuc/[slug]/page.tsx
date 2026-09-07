import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { getPublishedPostBySlug } from "@/lib/data/posts";
import { formatVNDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  return { title: post ? post.title : "Bài viết" };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <DecorativeSection contentClassName="mx-auto max-w-3xl">
        <Link
          href="/tin-tuc"
          className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          ← Tin tức
        </Link>

        {post.categoryName && (
          <Eyebrow tone="blue" className="mb-6">
            {post.categoryName}
          </Eyebrow>
        )}
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          {post.title}
        </h1>
        <div className="mt-3 font-mono text-[11.5px] uppercase tracking-wider text-ink-faint">
          {formatVNDate(post.publishedAt)}
        </div>

        <div className="relative mt-8 h-[320px] overflow-hidden rounded-2xl">
          {post.coverImageUrl ? (
            <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
          ) : (
            <ImagePlaceholder label="Ảnh bài viết" />
          )}
        </div>

        <MarkdownContent content={post.content} className="mt-8" />

        {post.attachmentUrl && (
          <a
            href={post.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm2 transition-colors hover:border-brand-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-lg">
              📎
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
                Tài liệu đính kèm
              </span>
              <span className="block truncate font-semibold text-brand-700">
                {post.attachmentName || "Tải tệp đính kèm"}
              </span>
            </span>
          </a>
        )}
    </DecorativeSection>
  );
}
