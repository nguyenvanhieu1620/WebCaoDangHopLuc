import type { Department, Faculty } from "@/lib/db/schema";
import { normalizeSearch, slugify } from "@/lib/utils";

/**
 * Danh bạ giảng viên có tìm kiếm nhiều tiêu chí (/doi-ngu-giang-vien): trang (server) dựng sẵn danh
 * sách gọn + các lựa chọn lọc bằng `buildFacultyDirectory`, client chỉ việc lọc bằng `filterMembers`.
 * Hàm thuần, không gọi DB — có test ở tests/ui-helpers.test.ts.
 */

export type DirectoryOption = { key: string; label: string; count: number };

export type DirectoryMember = {
  id: string;
  slug: string | null;
  displayName: string;
  role: string;
  specialty: string | null;
  photoUrl: string | null;
  departmentKey: string;
  departmentName: string;
  degreeKey: string | null;
  rankKey: string | null;
  roleKey: string;
  /** Chữ thường không dấu gộp mọi trường tìm được (tên, học vị, chức vụ, chuyên môn, khoa). */
  search: string;
};

export type DirectoryFilters = { q: string; khoa: string; trinhDo: string; hocHam: string; chucVu: string };

export const EMPTY_FILTERS: DirectoryFilters = { q: "", khoa: "", trinhDo: "", hocHam: "", chucVu: "" };

/** Khoá URL `?khoa=` cho giảng viên chưa gán khoa (hoặc khoa đã bị xoá). */
export const NO_DEPARTMENT_KEY = "khac";

/** Trình độ gom theo bậc — người xem tìm "Thạc sĩ" phải ra cả "ThS" lẫn "ThS.BS". Thứ tự = thứ tự hiện trong ô chọn. */
const DEGREE_LEVELS = [
  { key: "tien-si", label: "Tiến sĩ" },
  { key: "ck2", label: "Chuyên khoa II" },
  { key: "thac-si", label: "Thạc sĩ" },
  { key: "ck1", label: "Chuyên khoa I" },
  { key: "dai-hoc", label: "Đại học (BS, DS, CN…)" },
] as const;

/**
 * Bậc trình độ từ chuỗi học vị tự do ("ThS.BS", "BS.CKII", "DS.CKI", "TS"…; cũng hiểu vài cách viết
 * tiếng Anh khi đang xem bản EN). Không nhận ra → giữ nguyên chuỗi gốc làm 1 lựa chọn riêng.
 */
export function degreeLevel(degree: string | null | undefined): { key: string; label: string } | null {
  const raw = degree?.trim();
  if (!raw) return null;
  const n = normalizeSearch(raw).replace(/[.\s-]/g, "");
  const level = (key: (typeof DEGREE_LEVELS)[number]["key"]) => DEGREE_LEVELS.find((l) => l.key === key)!;
  if (/ckii|ck2|chuyenkhoa(ii|2)|specialistii/.test(n)) return level("ck2");
  if (/cki|ck1|chuyenkhoa(i|1)|specialisti/.test(n)) return level("ck1");
  if (/^ts|tiensi|phd|doctorate/.test(n)) return level("tien-si");
  if (/^ths|thacsi|^msc|master/.test(n)) return level("thac-si");
  if (/^(bs|ds|cn|ktv|ys|dd)|bacsi|duocsi|cunhan|bachelor|^md$/.test(n)) return level("dai-hoc");
  return { key: `khac-${slugify(raw)}`, label: raw };
}

/** Chữ thường không dấu, dấu câu thành khoảng trắng — "ThS.BS" tách thành "ths bs" để gõ "bs" cũng khớp. */
const searchText = (value: string) => normalizeSearch(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const countBy = (keys: (string | null)[]) => {
  const map = new Map<string, number>();
  for (const k of keys) if (k) map.set(k, (map.get(k) ?? 0) + 1);
  return map;
};

/** Dựng danh sách gọn cho client + các lựa chọn lọc (chỉ những giá trị thật sự có trong dữ liệu, kèm số lượng). */
export function buildFacultyDirectory(
  faculty: Faculty[],
  departments: Department[],
  displayName: (f: Faculty) => string
) {
  const deptById = new Map(departments.map((d) => [d.id, d]));
  const degreeLabels = new Map<string, string>();
  const members: DirectoryMember[] = faculty.map((f) => {
    const dept = f.departmentId ? deptById.get(f.departmentId) : undefined;
    const level = degreeLevel(f.degree);
    if (level) degreeLabels.set(level.key, level.label);
    const name = displayName(f);
    return {
      id: f.id,
      slug: f.slug,
      displayName: name,
      role: f.role,
      specialty: f.specialty?.trim() || null,
      photoUrl: f.photoUrl,
      departmentKey: dept ? dept.id : NO_DEPARTMENT_KEY,
      departmentName: dept ? dept.name : "Khác",
      degreeKey: level?.key ?? null,
      rankKey: f.academicRank?.trim() ? slugify(f.academicRank) : null,
      roleKey: slugify(f.role),
      search: searchText([name, f.name, f.role, f.specialty, dept?.name, level?.label, f.academicRank].filter(Boolean).join(" ")),
    };
  });

  const deptCounts = countBy(members.map((m) => m.departmentKey));
  const departmentOptions: DirectoryOption[] = departments
    .filter((d) => deptCounts.has(d.id))
    .map((d) => ({ key: d.id, label: d.name, count: deptCounts.get(d.id)! }));
  if (deptCounts.has(NO_DEPARTMENT_KEY)) {
    departmentOptions.push({ key: NO_DEPARTMENT_KEY, label: "Khác", count: deptCounts.get(NO_DEPARTMENT_KEY)! });
  }

  const degreeCounts = countBy(members.map((m) => m.degreeKey));
  const degreeOptions: DirectoryOption[] = [
    ...DEGREE_LEVELS.filter((l) => degreeCounts.has(l.key)).map((l) => ({ ...l, count: degreeCounts.get(l.key)! })),
    // Học vị lạ (không gom được) — xếp sau các bậc chuẩn.
    ...[...degreeCounts.keys()]
      .filter((k) => k.startsWith("khac-"))
      .map((k) => ({ key: k, label: degreeLabels.get(k) ?? k, count: degreeCounts.get(k)! })),
  ];

  // Học hàm / chức vụ: giữ thứ tự xuất hiện (danh sách đã xếp theo "Vị trí" admin nhập → lãnh đạo thường đứng đầu).
  const distinct = (pairs: [string | null, string | null | undefined][]) => {
    const seen = new Map<string, DirectoryOption>();
    for (const [key, label] of pairs) {
      if (!key || !label?.trim()) continue;
      const cur = seen.get(key);
      if (cur) cur.count += 1;
      else seen.set(key, { key, label: label.trim(), count: 1 });
    }
    return [...seen.values()];
  };
  const rankOptions = distinct(faculty.map((f, i) => [members[i].rankKey, f.academicRank]));
  const roleOptions = distinct(faculty.map((f, i) => [members[i].roleKey, f.role]));

  return { members, departmentOptions, degreeOptions, rankOptions, roleOptions };
}

/**
 * Lọc theo mọi tiêu chí (AND). Từ khoá tìm không dấu, mọi từ phải khớp ĐẦU 1 từ nào đó (gõ "an" ra
 * "Nguyễn Văn An" nhưng không ra "Trần…"; gõ dở "duon" vẫn ra "Điều dưỡng"). `ignore` bỏ qua 1 tiêu chí — dùng
 * để đếm số giảng viên của từng khoa theo các bộ lọc còn lại (số trên nút chọn khoa).
 */
export function filterMembers(members: DirectoryMember[], filters: DirectoryFilters, ignore?: keyof DirectoryFilters) {
  const words = ignore === "q" ? [] : searchText(filters.q).split(" ").filter(Boolean);
  return members.filter(
    (m) =>
      words.every((w) => ` ${m.search}`.includes(` ${w}`)) &&
      (ignore === "khoa" || !filters.khoa || m.departmentKey === filters.khoa) &&
      (ignore === "trinhDo" || !filters.trinhDo || m.degreeKey === filters.trinhDo) &&
      (ignore === "hocHam" || !filters.hocHam || m.rankKey === filters.hocHam) &&
      (ignore === "chucVu" || !filters.chucVu || m.roleKey === filters.chucVu)
  );
}
