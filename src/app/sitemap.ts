import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getAllPublishedPosts } from "@/lib/data/posts";
import { getPrograms } from "@/lib/data/programs";
import { getFacultyList } from "@/lib/data/faculty";
import { getPagesBySlugPrefix } from "@/lib/data/pages";
import { getEvents } from "@/lib/data/events";

/**
 * Sinh sitemap.xml tự động cho toàn site — gồm trang tĩnh cố định + mọi
 * route động (bài viết, ngành đào tạo, giảng viên, trang Công khai) lấy
 * thẳng từ DB, không cần cập nhật tay khi có nội dung mới.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/gioi-thieu",
    "/lien-he",
    "/tin-tuc",
    "/nganh-dao-tao",
    "/doi-ngu-giang-vien",
    "/su-kien",
    "/faq",
    "/tuyen-sinh",
    "/tra-cuu-ket-qua",
    "/thu-vien",
    "/lms",
    "/cong-khai",
    "/chinh-sach-bao-mat",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const [posts, programs, faculty, congKhaiPages, events] = await Promise.all([
    getAllPublishedPosts(),
    getPrograms(),
    getFacultyList(),
    getPagesBySlugPrefix("cong-khai"),
    getEvents(),
  ]);

  const postRoutes = posts.map((p) => ({
    url: `${SITE_URL}/tin-tuc/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
  }));
  const programRoutes = programs.map((p) => ({
    url: `${SITE_URL}/nganh-dao-tao/${p.slug}`,
    lastModified: new Date(),
  }));
  const facultyRoutes = faculty
    .filter((f): f is typeof f & { slug: string } => Boolean(f.slug))
    .map((f) => ({
      url: `${SITE_URL}/doi-ngu-giang-vien/${f.slug}`,
      lastModified: new Date(),
    }));
  const congKhaiRoutes = congKhaiPages.map((p) => ({
    url: `${SITE_URL}/cong-khai/${p.slug}`,
    lastModified: new Date(),
  }));
  const eventRoutes = events
    .filter((e): e is typeof e & { slug: string } => Boolean(e.slug))
    .map((e) => ({
      url: `${SITE_URL}/su-kien/${e.slug}`,
      lastModified: new Date(),
    }));

  return [
    ...staticRoutes,
    ...postRoutes,
    ...programRoutes,
    ...facultyRoutes,
    ...congKhaiRoutes,
    ...eventRoutes,
  ];
}
