import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPostsPage } from "@/lib/data/posts";
import { formatVNDate } from "@/lib/utils";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  return { title: category === "hoc-bong" ? "Học bổng" : "Tin tức" };
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const { posts, currentPage, totalPages } = await getPublishedPostsPage(category, pageNum);
  const isScholarship = category === "hoc-bong";
  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/tin-tuc?${qs}` : "/tin-tuc";
  };

  return (
    <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        <SectionHeading
          eyebrow={isScholarship ? "Học bổng" : "Tin tức"}
          title={isScholarship ? "Học bổng & chính sách hỗ trợ học phí" : "Hoạt động đào tạo, tuyển sinh mới nhất"}
          description={
            isScholarship
              ? "Thông tin học bổng, ưu đãi và hỗ trợ học phí dành cho sinh viên."
              : "Thông báo, sự kiện và hoạt động của nhà trường."
          }
        />

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            {isScholarship
              ? "Chưa có bài viết học bổng nào được đăng."
              : "Chưa có bài viết nào được đăng."}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 70}>
                <Link
                  href={`/tin-tuc/${post.slug}`}
                  className="block overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-transform hover:-translate-y-1.5"
                >
                  <div className="relative h-[170px]">
                    {post.coverImageUrl ? (
                      <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
                    ) : (
                      <ImagePlaceholder label="Ảnh bài viết" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                      {formatVNDate(post.publishedAt)}
                      {post.categoryName ? ` · ${post.categoryName}` : ""}
                    </div>
                    <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href={buildPageHref(currentPage - 1)}
              aria-disabled={currentPage <= 1}
              className={`rounded-lg border border-line px-4 py-2 text-[13px] font-semibold ${
                currentPage <= 1
                  ? "pointer-events-none opacity-40"
                  : "text-ink-soft hover:border-brand-500 hover:text-brand-700"
              }`}
            >
              ← Trước
            </Link>
            <span className="text-[13px] font-semibold text-ink-faint">
              Trang {currentPage}/{totalPages}
            </span>
            <Link
              href={buildPageHref(currentPage + 1)}
              aria-disabled={currentPage >= totalPages}
              className={`rounded-lg border border-line px-4 py-2 text-[13px] font-semibold ${
                currentPage >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "text-ink-soft hover:border-brand-500 hover:text-brand-700"
              }`}
            >
              Sau →
            </Link>
          </div>
        )}
    </DecorativeSection>
  );
}
