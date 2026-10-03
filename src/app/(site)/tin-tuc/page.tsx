import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { TiltCard } from "@/components/site/TiltCard";
import { getPublishedPostsPage, type PublishedPostPreview } from "@/lib/data/posts";
import { getCategories } from "@/lib/data/categories";
import { cn, formatVNDate } from "@/lib/utils";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  if (!category) return { title: "Tin tức" };
  const found = (await getCategories()).find((c) => c.slug === category);
  return { title: found?.name ?? "Tin tức" };
}

/** Số bài ở cột "Mới nhất" cạnh tin nổi bật (trang 1). */
const LATEST_LIST = 5;

/**
 * Trang tin tức dạng TỔNG HỢP kiểu VinUni: thanh tab chuyên mục → (trang 1)
 * tin nổi bật ảnh lớn + cột "Mới nhất" → lưới các bài còn lại → phân trang.
 * Trang 2 trở đi chỉ còn lưới. Lọc chuyên mục qua `?category=` như cũ (mục menu
 * "Học bổng" trỏ `/tin-tuc?category=hoc-bong`).
 */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const [{ posts, currentPage, totalPages }, categories] = await Promise.all([
    getPublishedPostsPage(category, pageNum),
    getCategories(),
  ]);
  const activeCategory = categories.find((c) => c.slug === category) ?? null;
  const isScholarship = category === "hoc-bong";
  const buildHref = (opts: { category?: string | null; page?: number }) => {
    const params = new URLSearchParams();
    const cat = opts.category === undefined ? category : opts.category;
    if (cat) params.set("category", cat);
    if (opts.page && opts.page > 1) params.set("page", String(opts.page));
    const qs = params.toString();
    return qs ? `/tin-tuc?${qs}` : "/tin-tuc";
  };

  const showHub = currentPage === 1 && posts.length >= 3;
  const featured = showHub ? posts[0] : null;
  const latest = showHub ? posts.slice(1, 1 + LATEST_LIST) : [];
  const rest = showHub ? posts.slice(1 + LATEST_LIST) : posts;

  return (
    <>
      <PageHero bannerKey="tin-tuc"
        crumbs={activeCategory ? [{ label: "Tin tức", href: "/tin-tuc" }, { label: activeCategory.name }] : [{ label: "Tin tức" }]}
        eyebrow={activeCategory ? "Chuyên mục" : "Tin tức & sự kiện"}
        title={
          activeCategory
            ? isScholarship
              ? "Học bổng & chính sách hỗ trợ học phí"
              : activeCategory.name
            : "Hoạt động đào tạo, tuyển sinh mới nhất"
        }
        description={
          isScholarship
            ? "Thông tin học bổng, ưu đãi và hỗ trợ học phí dành cho sinh viên."
            : "Thông báo, sự kiện và hoạt động của nhà trường."
        }
      />

      <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        {/* Thanh tab chuyên mục — cuộn ngang trên điện thoại */}
        {categories.length > 0 && (
          <nav aria-label="Chuyên mục tin tức" className="no-scrollbar -mx-6 mb-10 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <ul className="flex w-max gap-2 border-b border-line pb-4 sm:w-auto sm:flex-wrap">
              {[{ slug: null as string | null, name: "Tất cả" }, ...categories.map((c) => ({ slug: c.slug as string | null, name: c.name }))].map((c) => {
                const active = (c.slug ?? null) === (activeCategory?.slug ?? null);
                return (
                  <li key={c.slug ?? "all"}>
                    <Link
                      href={buildHref({ category: c.slug, page: 1 })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                        active ? "bg-brand-900 text-white shadow-sm2" : "border border-line bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700"
                      )}
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            {isScholarship ? "Chưa có bài viết học bổng nào được đăng." : "Chưa có bài viết nào được đăng."}
          </div>
        ) : (
          <>
            {featured && (
              <div className="mb-14 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
                <Reveal>
                  <TiltCard max={2.5} className="h-full rounded-[22px]">
                    <Link href={`/tin-tuc/${featured.slug}`} className="group relative block h-[380px] overflow-clip rounded-[22px] shadow-md2 sm:h-[460px] lg:h-full lg:min-h-[460px]">
                      <div className="img-reveal img-shine absolute inset-0">
                        {featured.coverImageUrl ? (
                          <Image
                            src={featured.coverImageUrl}
                            alt={featured.title}
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 740px"
                            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                          />
                        ) : (
                          <ImagePlaceholder label="Ảnh bài viết" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/40 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <span className="rounded bg-accent-600 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                            {featured.categoryName ?? "Tin nổi bật"}
                          </span>
                          <span className="font-mono text-[11px] text-white/75">{formatVNDate(featured.publishedAt)}</span>
                        </div>
                        <h2 className="max-w-2xl font-display text-[24px] font-semibold leading-snug sm:text-[32px]">{featured.title}</h2>
                        {featured.excerpt && <p className="mt-3 line-clamp-2 max-w-2xl text-[14.5px] leading-relaxed text-white/80">{featured.excerpt}</p>}
                        <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-bold">
                          <span className="link-underline">Đọc tiếp</span>
                          <span className="transition-transform group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </Link>
                  </TiltCard>
                </Reveal>

                <div>
                  <h2 className="mb-2 font-display text-[22px] font-semibold uppercase tracking-wide text-accent-600">Mới nhất</h2>
                  <ul className="divide-y divide-line">
                    {latest.map((p, i) => (
                      <li key={p.id}>
                        <Reveal delay={i * 70}>
                          <Link href={`/tin-tuc/${p.slug}`} className="group flex gap-4 py-4">
                            <div className="img-shine relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-xl">
                              {p.coverImageUrl ? (
                                <Image src={p.coverImageUrl} alt="" fill sizes="96px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                              ) : (
                                <ImagePlaceholder label="Tin" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                {p.categoryName && (
                                  <span className="whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-600">{p.categoryName}</span>
                                )}
                                <span className="font-mono text-[10px] text-ink-faint">{formatVNDate(p.publishedAt)}</span>
                              </div>
                              <h3 className="mt-1 line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">
                                {p.title}
                              </h3>
                            </div>
                          </Link>
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <>
                {featured && (
                  <div className="mb-6 flex items-center gap-4">
                    <span className="h-6 w-1 rounded-full bg-accent-600" />
                    <h2 className="font-display text-[22px] font-semibold text-brand-900">Tất cả bài viết</h2>
                  </div>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, i) => (
                    <PostCard key={post.id} post={post} index={i} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {totalPages > 1 && (
          <nav aria-label="Phân trang" className="mt-12 flex items-center justify-center gap-3">
            <Link
              href={buildHref({ page: currentPage - 1 })}
              aria-disabled={currentPage <= 1}
              className={cn(
                "rounded-full border border-line px-5 py-2.5 text-[13px] font-semibold",
                currentPage <= 1 ? "pointer-events-none opacity-40" : "bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700"
              )}
            >
              ← Trước
            </Link>
            <span className="font-mono text-[12px] tracking-[0.16em] text-ink-faint">
              <span className="text-brand-900">{String(currentPage).padStart(2, "0")}</span> / {String(totalPages).padStart(2, "0")}
            </span>
            <Link
              href={buildHref({ page: currentPage + 1 })}
              aria-disabled={currentPage >= totalPages}
              className={cn(
                "rounded-full border border-line px-5 py-2.5 text-[13px] font-semibold",
                currentPage >= totalPages ? "pointer-events-none opacity-40" : "bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700"
              )}
            >
              Sau →
            </Link>
          </nav>
        )}
      </DecorativeSection>
    </>
  );
}

function PostCard({ post, index }: { post: PublishedPostPreview; index: number }) {
  return (
    <Reveal delay={(index % 3) * 80}>
      <TiltCard max={5} className="h-full rounded-2xl">
        <Link
          href={`/tin-tuc/${post.slug}`}
          className="group block h-full overflow-clip rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2"
        >
          <div className="img-reveal img-shine relative h-[180px]">
            {post.coverImageUrl ? (
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder label="Ảnh bài viết" />
            )}
          </div>
          <div className="p-5">
            {/* Nhãn chuyên mục đỏ in hoa (giống Trang chủ) — ngày tách riêng, chữ nhạt */}
            <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {post.categoryName && (
                <span className="whitespace-nowrap font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-600">{post.categoryName}</span>
              )}
              <span className="font-mono text-[10.5px] text-ink-faint">{formatVNDate(post.publishedAt)}</span>
            </div>
            <h3 className="font-display text-[17px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">{post.title}</h3>
            {post.excerpt && <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-soft">{post.excerpt}</p>}
          </div>
        </Link>
      </TiltCard>
    </Reveal>
  );
}
