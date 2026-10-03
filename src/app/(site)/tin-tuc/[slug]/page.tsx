import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { MoreLink } from "@/components/ui/MoreLink";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
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
    <>
      {/* Ảnh bìa bài viết làm nền banner — tiêu đề, chuyên mục, ngày đăng đè lên (kiểu tạp chí). */}
      <PageHero
        crumbs={[{ label: "Tin tức", href: "/tin-tuc" }, { label: post.title }]}
        title={post.title}
        imageUrl={post.coverImageUrl}
        variant="article"
      >
        <div className="flex flex-wrap items-center gap-3">
          {post.categoryName && (
            <span className="rounded bg-accent-600 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]">
              {post.categoryName}
            </span>
          )}
          <span className="font-mono text-[12px] uppercase tracking-wider text-white/75">{formatVNDate(post.publishedAt)}</span>
        </div>
      </PageHero>

      <DecorativeSection contentClassName="mx-auto max-w-3xl">
        {post.excerpt && (
          <p className="mb-8 border-l-4 border-accent-600 pl-5 font-display text-[19px] leading-relaxed text-brand-900 sm:text-[21px]">
            {post.excerpt}
          </p>
        )}
        <MarkdownContent content={post.content} />

        {post.attachmentUrl && (
          <a
            href={post.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm2 transition-colors hover:border-brand-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-lg">
              📎
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
                Tài liệu đính kèm
              </span>
              <span className="block truncate font-semibold text-brand-700">
                <span className="link-underline">{post.attachmentName || "Tải tệp đính kèm"}</span>
              </span>
            </span>
          </a>
        )}

        <div className="mt-12 border-t border-line pt-6">
          <MoreLink href="/tin-tuc">Xem tin tức khác</MoreLink>
        </div>
      </DecorativeSection>
    </>
  );
}
