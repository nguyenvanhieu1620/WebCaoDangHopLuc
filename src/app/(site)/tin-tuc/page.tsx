import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { getAllPublishedPosts } from "@/lib/data/posts";
import { formatVNDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tin tức & sự kiện" };

export default async function NewsPage() {
  const posts = await getAllPublishedPosts();

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-[1220px]">
        <SectionHeading
          eyebrow="Tin tức & sự kiện"
          title="Hoạt động đào tạo, tuyển sinh mới nhất"
          description="Thông báo, sự kiện và hoạt động của nhà trường."
        />

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có bài viết nào được đăng.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
