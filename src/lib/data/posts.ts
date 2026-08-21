import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export type PublishedPostPreview = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
  publishedAt: string | null;
};

/** Bài viết đã đăng, mới nhất trước — dùng cho khối "Tin tức" ở Trang chủ. */
export async function getLatestPublishedPosts(limit: number): Promise<PublishedPostPreview[]> {
  const rows = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: desc(schema.posts.publishedAt),
    limit,
  });
  if (rows.length === 0) return [];

  const categoryIds = [...new Set(rows.map((r) => r.categoryId).filter((id): id is string => !!id))];
  const categoryRows =
    categoryIds.length > 0
      ? await db.query.categories.findMany({
          where: (c, { inArray }) => inArray(c.id, categoryIds),
        })
      : [];
  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverImageUrl: r.coverImageUrl,
    categoryName: r.categoryId ? categoryNameById.get(r.categoryId) ?? null : null,
    publishedAt: r.publishedAt,
  }));
}
