"use server";

import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentAdminUser, hasPermission } from "@/lib/admin-auth";
import { normalizeSearch } from "@/lib/utils";

export type AdminSearchResult = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
};

const PER_GROUP = 5;
const MAX_QUERY = 100;

/**
 * Tìm nhanh bản ghi cho bảng lệnh Ctrl+K của admin. Chỉ trả về nhóm dữ liệu
 * thuộc module tài khoản được cấp quyền (cùng logic `requirePermission`).
 * Lấy hết rồi lọc trong JS bằng `normalizeSearch` để tìm được không dấu —
 * đủ nhanh ở quy mô 1 trường (giống cách lọc ở admin/bai-viet, admin/tuyen-sinh).
 */
export async function adminSearchAction(rawQuery: string): Promise<AdminSearchResult[]> {
  const user = await getCurrentAdminUser();
  if (!user) return [];
  const q = normalizeSearch(String(rawQuery ?? "").slice(0, MAX_QUERY));
  if (q.length < 2) return [];
  const matches = (...fields: (string | null | undefined)[]) =>
    normalizeSearch(fields.filter(Boolean).join(" ")).includes(q);

  const can = (key: string) => hasPermission(user, key);
  const [posts, programs, faculty, events, pages, admissions, messages] = await Promise.all([
    can("posts")
      ? db.query.posts.findMany({ columns: { id: true, title: true, status: true }, orderBy: [desc(schema.posts.createdAt), desc(schema.posts.seq)] })
      : [],
    can("programs") ? db.query.programs.findMany({ columns: { id: true, name: true, code: true }, orderBy: asc(schema.programs.seq) }) : [],
    can("faculty")
      ? db.query.faculty.findMany({ columns: { id: true, name: true, degree: true, role: true }, orderBy: asc(schema.faculty.seq) })
      : [],
    can("events")
      ? db.query.events.findMany({ columns: { id: true, title: true, location: true }, orderBy: [desc(schema.events.startAt), desc(schema.events.seq)] })
      : [],
    can("pages") ? db.query.pages.findMany({ columns: { id: true, title: true, slug: true }, orderBy: asc(schema.pages.seq) }) : [],
    can("admissions-contact")
      ? db.query.admissionSubmissions.findMany({
          columns: { id: true, fullName: true, phone: true, idNumber: true, program: true },
          orderBy: [desc(schema.admissionSubmissions.createdAt), desc(schema.admissionSubmissions.seq)],
        })
      : [],
    can("admissions-contact")
      ? db.query.contactMessages.findMany({
          columns: { id: true, name: true, phone: true, email: true },
          orderBy: [desc(schema.contactMessages.createdAt), desc(schema.contactMessages.seq)],
        })
      : [],
  ]);

  const results: AdminSearchResult[] = [];
  const push = <T,>(items: T[], pick: (item: T) => AdminSearchResult | null) => {
    let n = 0;
    for (const item of items) {
      if (n >= PER_GROUP) break;
      const r = pick(item);
      if (r) {
        results.push(r);
        n++;
      }
    }
  };

  push(posts, (p) =>
    matches(p.title)
      ? { id: `post-${p.id}`, group: "Bài viết", label: p.title, hint: p.status === "published" ? "Đã đăng" : "Bản nháp", href: `/admin/bai-viet?edit=${p.id}` }
      : null
  );
  push(programs, (p) =>
    matches(p.name, p.code)
      ? { id: `program-${p.id}`, group: "Ngành đào tạo", label: p.name, hint: `Mã ${p.code}`, href: `/admin/nganh-dao-tao?edit=${p.id}` }
      : null
  );
  push(faculty, (f) =>
    matches(f.name, f.degree, f.role)
      ? { id: `faculty-${f.id}`, group: "Giảng viên", label: [f.degree, f.name].filter(Boolean).join(" "), hint: f.role, href: `/admin/giang-vien?edit=${f.id}` }
      : null
  );
  push(events, (e) =>
    matches(e.title, e.location)
      ? { id: `event-${e.id}`, group: "Sự kiện", label: e.title, hint: e.location ?? undefined, href: `/admin/su-kien?edit=${e.id}` }
      : null
  );
  push(pages, (p) =>
    matches(p.title, p.slug)
      ? { id: `page-${p.id}`, group: "Trang tĩnh", label: p.title, hint: `/${p.slug}`, href: `/admin/trang-tinh?edit=${p.id}` }
      : null
  );
  push(admissions, (a) =>
    matches(a.fullName, a.phone, a.idNumber, a.program)
      ? { id: `admission-${a.id}`, group: "Hồ sơ tuyển sinh", label: a.fullName, hint: `${a.program} · ${a.phone}`, href: `/admin/tuyen-sinh?q=${encodeURIComponent(a.phone)}` }
      : null
  );
  push(messages, (m) =>
    matches(m.name, m.phone, m.email)
      ? { id: `message-${m.id}`, group: "Tin nhắn liên hệ", label: m.name, hint: m.phone ?? m.email ?? undefined, href: `/admin/lien-he` }
      : null
  );

  return results;
}
