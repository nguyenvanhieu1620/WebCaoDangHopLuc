import { db, schema } from "@/lib/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";

export const POSTS_PER_PAGE = 12;

export type PublishedPostPreview = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  /** Tệp đính kèm (PDF/Word/Excel) — VD quyết định tuyển sinh, biểu mẫu. null nếu bài không có. */
  attachmentUrl: string | null;
  attachmentName: string | null;
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
  const [rows, locale] = await Promise.all([
    db.query.posts.findMany({
      where: eq(schema.posts.status, "published"),
      orderBy: desc(schema.posts.publishedAt),
      limit,
    }),
    getLocale(),
  ]);
  if (rows.length === 0) return [];

  const names = await categoryNameMap(
    [...new Set(rows.map((r) => r.categoryId).filter((id): id is string => !!id))]
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: pickLocale(r.title, r.titleEn, locale),
    excerpt: r.excerpt ? pickLocale(r.excerpt, r.excerptEn, locale) : r.excerpt,
    coverImageUrl: r.coverImageUrl,
    categoryName: r.categoryId ? names.get(r.categoryId) ?? null : null,
    publishedAt: r.publishedAt,
    attachmentUrl: r.attachmentUrl,
    attachmentName: r.attachmentName,
  }));
}

/** Bài viết đã đăng và được ghim (`isPinned`), mới nhất trước — dùng cho khối "Thông báo" ở Trang chủ. */
export async function getPinnedPosts(limit: number): Promise<PublishedPostPreview[]> {
  const [rows, locale] = await Promise.all([
    db.query.posts.findMany({
      where: and(eq(schema.posts.status, "published"), eq(schema.posts.isPinned, 1)),
      orderBy: desc(schema.posts.publishedAt),
      limit,
    }),
    getLocale(),
  ]);
  if (rows.length === 0) return [];

  const names = await categoryNameMap(
    [...new Set(rows.map((r) => r.categoryId).filter((id): id is string => !!id))]
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: pickLocale(r.title, r.titleEn, locale),
    excerpt: r.excerpt ? pickLocale(r.excerpt, r.excerptEn, locale) : r.excerpt,
    coverImageUrl: r.coverImageUrl,
    categoryName: r.categoryId ? names.get(r.categoryId) ?? null : null,
    publishedAt: r.publishedAt,
    attachmentUrl: r.attachmentUrl,
    attachmentName: r.attachmentName,
  }));
}

/**
 * Toàn bộ bài viết đã đăng, mới nhất trước — dùng cho trang danh sách
 * /tin-tuc. Có `categorySlug` (VD "hoc-bong") thì chỉ lấy bài thuộc đúng
 * danh mục đó — dùng cho mục Học bổng (tận dụng hệ thống Danh mục có sẵn,
 * không cần bảng riêng).
 */
export async function getAllPublishedPosts(categorySlug?: string): Promise<PublishedPostPreview[]> {
  if (!categorySlug) return getLatestPublishedPosts(Number.MAX_SAFE_INTEGER);

  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, categorySlug),
  });
  if (!category) return [];

  const [rows, locale] = await Promise.all([
    db.query.posts.findMany({
      where: and(eq(schema.posts.status, "published"), eq(schema.posts.categoryId, category.id)),
      orderBy: desc(schema.posts.publishedAt),
    }),
    getLocale(),
  ]);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: pickLocale(r.title, r.titleEn, locale),
    excerpt: r.excerpt ? pickLocale(r.excerpt, r.excerptEn, locale) : r.excerpt,
    coverImageUrl: r.coverImageUrl,
    categoryName: pickLocale(category.name, category.nameEn, locale),
    publishedAt: r.publishedAt,
    attachmentUrl: r.attachmentUrl,
    attachmentName: r.attachmentName,
  }));
}

export type PublishedPostsPage = {
  posts: PublishedPostPreview[];
  currentPage: number;
  totalPages: number;
};

/**
 * Bài viết đã đăng, PHÂN TRANG — dùng cho `/tin-tuc` (`getAllPublishedPosts`
 * không phân trang vẫn giữ nguyên cho `sitemap.ts`, cần liệt kê đủ mọi bài).
 * Dùng LIMIT/OFFSET + 1 query COUNT riêng thay vì lấy hết rồi cắt mảng —
 * tránh trang càng nhiều bài viết theo thời gian thì mỗi lượt tải trang
 * càng nặng dần (xem CLAUDE.md mục 5 "Đánh giá rủi ro traffic lớn").
 */
export async function getPublishedPostsPage(
  categorySlug: string | undefined,
  page: number
): Promise<PublishedPostsPage> {
  let categoryId: string | undefined;
  let categoryRow: { name: string; nameEn: string | null } | undefined;
  if (categorySlug) {
    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, categorySlug),
    });
    if (!category) return { posts: [], currentPage: 1, totalPages: 0 };
    categoryId = category.id;
    categoryRow = category;
  }

  const whereClause = categoryId
    ? and(eq(schema.posts.status, "published"), eq(schema.posts.categoryId, categoryId))
    : eq(schema.posts.status, "published");

  const [[{ total }], locale] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(schema.posts).where(whereClause),
    getLocale(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const rows = await db.query.posts.findMany({
    where: whereClause,
    orderBy: desc(schema.posts.publishedAt),
    limit: POSTS_PER_PAGE,
    offset: (currentPage - 1) * POSTS_PER_PAGE,
  });

  const names = categoryRow
    ? new Map<string, string>()
    : await categoryNameMap([...new Set(rows.map((r) => r.categoryId).filter((id): id is string => !!id))]);

  return {
    posts: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: pickLocale(r.title, r.titleEn, locale),
      excerpt: r.excerpt ? pickLocale(r.excerpt, r.excerptEn, locale) : r.excerpt,
      coverImageUrl: r.coverImageUrl,
      categoryName: categoryRow
        ? pickLocale(categoryRow.name, categoryRow.nameEn, locale)
        : r.categoryId
          ? names.get(r.categoryId) ?? null
          : null,
      publishedAt: r.publishedAt,
      attachmentUrl: r.attachmentUrl,
      attachmentName: r.attachmentName,
    })),
    currentPage,
    totalPages,
  };
}

/** 1 bài viết đã đăng theo slug — dùng cho trang chi tiết /tin-tuc/[slug]. Trả về null nếu không có hoặc chưa đăng. */
export async function getPublishedPostBySlug(slug: string): Promise<PublishedPostDetail | null> {
  const [row, locale] = await Promise.all([
    db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) }),
    getLocale(),
  ]);
  if (!row || row.status !== "published") return null;

  const names = await categoryNameMap(row.categoryId ? [row.categoryId] : []);
  return {
    id: row.id,
    slug: row.slug,
    title: pickLocale(row.title, row.titleEn, locale),
    excerpt: row.excerpt ? pickLocale(row.excerpt, row.excerptEn, locale) : row.excerpt,
    coverImageUrl: row.coverImageUrl,
    categoryName: row.categoryId ? names.get(row.categoryId) ?? null : null,
    publishedAt: row.publishedAt,
    attachmentUrl: row.attachmentUrl,
    attachmentName: row.attachmentName,
    content: pickLocale(row.content, row.contentEn, locale),
  };
}
