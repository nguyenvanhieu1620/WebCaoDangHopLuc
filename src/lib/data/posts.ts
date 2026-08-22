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

export type PublishedPostDetail = PublishedPostPreview & {
  content: string;
};

async function categoryNameMap(categoryIds: string[]): Promise<Map<string, string>> {
  if (categoryIds.length === 0) return new Map();
  const rows = await db.query.categories.findMany({
    where: (c, { inArray }) => inArray(c.id, categoryIds),
  });
  return new Map(rows.map((c) => [c.id, c.name]));
}

/** Bài viết đã đăng, mới nhất trước — dùng cho khối "Tin tức" ở Trang chủ. */
export async function getLatestPublishedPosts(limit: number): Promise<PublishedPostPreview[]> {
  const rows = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: desc(schema.posts.publishedAt),
    limit,
  });
  if (rows.length === 0) return [];

  const names = await categoryNameMap(
    [...new Set(rows.map((r) => r.categoryId).filter((id): id is string => !!id))]
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverImageUrl: r.coverImageUrl,
    categoryName: r.categoryId ? names.get(r.categoryId) ?? null : null,
    publishedAt: r.publishedAt,
  }));
}

/** Toàn bộ bài viết đã đăng, mới nhất trước — dùng cho trang danh sách /tin-tuc. */
export async function getAllPublishedPosts(): Promise<PublishedPostPreview[]> {
  return getLatestPublishedPosts(Number.MAX_SAFE_INTEGER);
}

/** 1 bài viết đã đăng theo slug — dùng cho trang chi tiết /tin-tuc/[slug]. Trả về null nếu không có hoặc chưa đăng. */
export async function getPublishedPostBySlug(slug: string): Promise<PublishedPostDetail | null> {
  const row = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });
  if (!row || row.status !== "published") return null;

  const names = await categoryNameMap(row.categoryId ? [row.categoryId] : []);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    categoryName: row.categoryId ? names.get(row.categoryId) ?? null : null,
    publishedAt: row.publishedAt,
    content: row.content,
  };
}
