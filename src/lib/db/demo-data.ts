import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, like, notInArray } from "drizzle-orm";
import { closeDb, db } from "./client";
import * as s from "./schema";

/**
 * DỮ LIỆU DEMO để xem trực quan "admin nhập gì thì web hiện thế nào" — CHỈ
 * dùng trên DB dev, KHÔNG phải dữ liệu thật của trường.
 *
 *   npm run demo:load   — tải 15 ảnh miễn phí (Unsplash License) vào
 *                         public/uploads/demo-*.jpg + nạp bài viết, sự kiện,
 *                         thư viện, ảnh giảng viên, học phí, mốc tuyển sinh,
 *                         ~22 hồ sơ tuyển sinh rải 30 ngày (cho biểu đồ
 *                         Dashboard), tin nhắn liên hệ, email nhận tin.
 *   npm run demo:clean  — xoá đúng những gì demo đã thêm + trả lại giá trị
 *                         gốc của các bản ghi có sẵn đã bị sửa (lưu trong
 *                         drizzle/demo-manifest.local.json, không commit).
 *
 * Banner/bài viết tạo tay qua admin bằng ảnh demo (đường dẫn /uploads/demo-*)
 * cũng được demo:clean nhận ra và xoá theo — nhờ vậy có thể vừa nạp bằng
 * script vừa thử thao tác thật trên giao diện admin.
 */

const MANIFEST = path.join(process.cwd(), "drizzle", "demo-manifest.local.json");
const UPLOADS = path.join(process.cwd(), "public", "uploads");
const DEMO_URL_PREFIX = "/uploads/demo-";

/** Ảnh Unsplash miễn phí (không lấy ảnh Premium/+) — chủ đề y tế, phòng lab, tốt nghiệp chung chung. */
const IMAGES: { key: string; photo: string; portrait?: boolean; note: string }[] = [
  { key: "banner-thuc-hanh", photo: "photo-1783519890730-3436fd0bf965", note: "Sinh viên thực hành trên mô hình" },
  { key: "banner-dieu-duong", photo: "photo-1691139601099-932c01ec198b", note: "Nhân viên y tế mặc scrubs" },
  { key: "banner-xet-nghiem", photo: "photo-1630959305790-4c956ce6c0b6", note: "Người mặc áo blouse soi kính hiển vi" },
  { key: "post-tot-nghiep", photo: "photo-1590012314607-cda9d9b699ae", note: "Tân cử nhân áo xanh" },
  { key: "post-so-cuu", photo: "photo-1770215624975-12e0db0b83ec", note: "Thực hành sơ cứu nhi trên mô hình" },
  { key: "event-phat-bieu", photo: "photo-1539413595691-37a09a48579b", note: "Phát biểu tại lễ tốt nghiệp" },
  { key: "g-nem-mu", photo: "photo-1534009916851-7850ba974f9c", note: "Tung mũ tốt nghiệp" },
  { key: "g-mo-phong", photo: "photo-1645684949347-58cb7ebfeaca", note: "Phòng mô phỏng lâm sàng" },
  { key: "g-kinh-hien-vi", photo: "photo-1727091506038-5451111dc2fb", note: "Soi kính hiển vi" },
  { key: "g-tan-sinh-vien", photo: "photo-1761781342506-821be95168c5", note: "Tân sinh viên" },
  { key: "g-dung-cu", photo: "photo-1583911860205-72f8ac8ddcbe", note: "Dụng cụ thực hành" },
  { key: "gv-1", photo: "photo-1580281658626-ee379f3cce93", portrait: true, note: "Chân dung nam" },
  { key: "gv-2", photo: "photo-1581065178047-8ee15951ede6", portrait: true, note: "Chân dung nữ" },
  { key: "gv-3", photo: "photo-1642541724244-83d49288a86b", portrait: true, note: "Chân dung nam (áo blouse)" },
  { key: "gv-4", photo: "photo-1668049221564-862149a48e10", portrait: true, note: "Chân dung nữ" },
];

type TableKey = "posts" | "events" | "faculty" | "programs" | "admissionItems" | "siteSettings";
type Manifest = {
  loadedAt: string;
  mediaIds: string[];
  /** `milestones` có từ đợt VinUni lượt 2 — manifest cũ không có, xem `loadExtras()`. */
  created: Record<"posts" | "events" | "gallery" | "admissions" | "contacts" | "newsletter", string[]> & {
    milestones?: string[];
    /** Slug các ngành đã gắn ảnh demo (đánh dấu đã chạy bước này; giá trị cũ nằm trong `restored`). */
    programImages?: string[];
  };
  restored: { table: TableKey; id: string; field: string; value: string | null }[];
};

const TABLES = {
  posts: s.posts,
  events: s.events,
  faculty: s.faculty,
  programs: s.programs,
  admissionItems: s.admissionItems,
  siteSettings: s.siteSettings,
} as const;

const url = (key: string) => `${DEMO_URL_PREFIX}${key}.jpg`;
const daysAgoIso = (days: number, hourUtc = 3) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hourUtc, Math.floor(Math.random() * 59), 0, 0);
  return d;
};
/** Định dạng `created_at` mặc định của DB: "YYYY-MM-DD HH:MM:SS" giờ UTC (xem `nowText` trong schema.ts). */
const dbTs = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
/** Giờ Việt Nam (UTC+7) → ISO UTC, cho start_at sự kiện. */
const vnIso = (y: number, m: number, d: number, h: number) => new Date(Date.UTC(y, m - 1, d, h - 7)).toISOString();

async function download() {
  await mkdir(UPLOADS, { recursive: true });
  const ids: string[] = [];
  for (const img of IMAGES) {
    const params = img.portrait
      ? "w=640&h=800&fit=crop&crop=faces&q=72&fm=jpg"
      : "w=1920&h=1080&fit=crop&q=72&fm=jpg";
    const res = await fetch(`https://images.unsplash.com/${img.photo}?${params}`);
    if (!res.ok) throw new Error(`Tải ảnh ${img.key} thất bại: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(UPLOADS, `demo-${img.key}.jpg`), buf);
    const [row] = await db
      .insert(s.mediaItems)
      .values({ filename: `demo-${img.key}.jpg`, url: url(img.key), type: "image" })
      .returning({ id: s.mediaItems.id });
    ids.push(row.id);
    console.log(`  ✓ ${img.key} (${Math.round(buf.length / 1024)} KB) — ${img.note}`);
  }
  return ids;
}

/** Sửa 1 field của bản ghi có sẵn, ghi lại giá trị cũ vào manifest để demo:clean trả lại. */
async function patchRecord(manifest: Manifest, table: TableKey, id: string, field: string, value: string | null) {
  // Ép kiểu về 1 bảng đại diện: các bảng đều có cột `id` text, field truyền vào luôn là cột có thật.
  const t = TABLES[table] as unknown as typeof s.posts;
  const current = (await db.select().from(t).where(eq(t.id, id)))[0] as Record<string, unknown> | undefined;
  if (!current) return;
  manifest.restored.push({ table, id, field, value: (current[field] as string | null) ?? null });
  await db.update(t).set({ [field]: value } as Partial<typeof s.posts.$inferInsert>).where(eq(t.id, id));
}

/**
 * Phần demo bổ sung sau lần nạp đầu — mỗi bước tự đánh dấu trong manifest nên chạy
 * cả khi DB đã nạp demo từ trước (không phải xoá rồi tải lại ảnh):
 * - VinUni lượt 2: vài "Mốc mẫu" cho /gioi-thieu + ảnh banner mặc định trang con
 *   (nội dung ghi rõ là MẪU, không phải lịch sử thật của trường);
 * - ảnh minh hoạ cho 6 ngành đào tạo (`programs.imageUrl`, trả lại giá trị gốc khi clean).
 */
async function loadExtras(manifest: Manifest) {
  let changed = false;
  if (!manifest.created.milestones) {
    await loadMilestonesAndBanner(manifest);
    changed = true;
  }
  if (!manifest.created.programImages) {
    // Ảnh minh hoạ chung chung (đã tải sẵn) cho từng ngành — chỉ gắn khi ngành chưa có ảnh thật.
    const imageBySlug: Record<string, string> = {
      "dieu-duong": "banner-dieu-duong",
      duoc: "g-dung-cu",
      "xet-nghiem-y-hoc": "g-kinh-hien-vi",
      "ho-sinh": "post-so-cuu",
      "phuc-hoi-chuc-nang": "banner-thuc-hanh",
      "y-si-da-khoa": "g-mo-phong",
    };
    const done: string[] = [];
    for (const p of await db.query.programs.findMany()) {
      if (imageBySlug[p.slug] && !p.imageUrl) {
        await patchRecord(manifest, "programs", p.id, "imageUrl", url(imageBySlug[p.slug]));
        done.push(p.slug);
      }
    }
    manifest.created.programImages = done;
    changed = true;
  }
  return changed;
}

async function loadMilestonesAndBanner(manifest: Manifest) {
  const sample = "Nội dung minh hoạ cho dòng thời gian — thay bằng mốc thật trong admin › Trang tĩnh › Cột mốc.";
  const items: (typeof s.milestones.$inferInsert)[] = [
    { id: "demo-milestone-1", year: 2020, period: "Tháng 9", title: "Mốc mẫu: khai giảng khoá đầu tiên", description: sample, imageUrl: url("g-tan-sinh-vien"), sortOrder: 0 },
    { id: "demo-milestone-2", year: 2022, period: "Tháng 3", title: "Mốc mẫu: đưa vào sử dụng phòng thực hành mô phỏng", description: sample, imageUrl: url("g-mo-phong"), sortOrder: 0 },
    { id: "demo-milestone-3", year: 2022, period: "Tháng 10", title: "Mốc mẫu: ký kết hợp tác thực hành với bệnh viện", description: sample, sortOrder: 1 },
    { id: "demo-milestone-4", year: 2024, period: "Tháng 6", title: "Mốc mẫu: lễ tốt nghiệp khoá đầu tiên", description: sample, imageUrl: url("post-tot-nghiep"), sortOrder: 0 },
    { id: "demo-milestone-5", year: 2026, period: "Tháng 3", title: "Mốc mẫu: mở thêm ngành đào tạo mới", description: sample, sortOrder: 0 },
    { id: "demo-milestone-6", year: 2026, period: "Tháng 9", title: "Mốc mẫu: ra mắt website mới", description: sample, imageUrl: url("g-kinh-hien-vi"), sortOrder: 1 },
  ];
  await db.insert(s.milestones).values(items);
  manifest.created.milestones = items.map((m) => m.id!);
  await patchRecord(manifest, "siteSettings", "main", "pageBannerUrl", url("g-mo-phong"));
  return true;
}

async function load() {
  if (existsSync(MANIFEST)) {
    const existing: Manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
    if (await loadExtras(existing)) {
      await writeFile(MANIFEST, JSON.stringify(existing, null, 2));
      console.log("✓ Đã bổ sung phần demo mới (cột mốc mẫu, ảnh banner trang con, ảnh ngành) vào bộ demo đang có.");
    } else {
      console.log("Đã nạp dữ liệu demo từ trước — chạy `npm run demo:clean` rồi nạp lại nếu muốn làm mới.");
    }
    return;
  }
  const manifest: Manifest = {
    loadedAt: new Date().toISOString(),
    mediaIds: [],
    created: { posts: [], events: [], gallery: [], admissions: [], contacts: [], newsletter: [] },
    restored: [],
  };
  const save = () => writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  const patch = (table: TableKey, id: string, field: string, value: string | null) => patchRecord(manifest, table, id, field, value);

  console.log("Tải ảnh demo (Unsplash)...");
  manifest.mediaIds = await download();
  await save();

  // Danh mục để gán bài viết
  const cats = await db.query.categories.findMany();
  const cat = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? null;

  // ===== Bài viết: thêm ảnh bìa cho 2 bài có sẵn + 3 bài mới (2 bài ghim làm Thông báo)
  const posts = await db.query.posts.findMany();
  const bySlugStart = (text: string) => posts.find((p) => p.title.startsWith(text));
  const p1 = bySlugStart("Mở cổng đăng ký xét tuyển đợt 2");
  const p2 = bySlugStart("Ngày hội việc làm");
  if (p1) {
    await patch("posts", p1.id, "coverImageUrl", url("banner-thuc-hanh"));
    await patch("posts", p1.id, "categoryId", cat("tuyen-sinh"));
  }
  if (p2) {
    await patch("posts", p2.id, "coverImageUrl", url("banner-dieu-duong"));
    await patch("posts", p2.id, "categoryId", cat("hop-tac"));
  }
  const newPosts: (typeof s.posts.$inferInsert)[] = [
    {
      id: "demo-post-so-cuu",
      slug: "demo-sinh-vien-thuc-hanh-so-cuu-nhi-khoa",
      title: "Sinh viên Điều dưỡng thực hành sơ cứu nhi khoa trên mô hình",
      excerpt: "Buổi thực hành giúp sinh viên năm hai làm chủ kỹ năng hồi sức tim phổi cho trẻ nhỏ trước khi đi thực tập bệnh viện.",
      content:
        "## Thực hành trước, đi viện sau\n\nTrong tuần qua, sinh viên năm hai ngành **Điều dưỡng** đã hoàn thành chuỗi buổi thực hành sơ cứu nhi khoa tại phòng mô phỏng của trường.\n\n- Hồi sức tim phổi (CPR) cho trẻ sơ sinh và trẻ nhỏ\n- Xử trí dị vật đường thở\n- Phối hợp nhóm khi cấp cứu\n\n> Được thực hành nhiều lần trên mô hình giúp em tự tin hơn hẳn khi bước vào kỳ thực tập. — *Sinh viên lớp ĐD24A*\n\n*(Bài viết demo — dữ liệu thử nghiệm giao diện.)*",
      status: "published",
      categoryId: cat("dao-tao"),
      coverImageUrl: url("post-so-cuu"),
      publishedAt: daysAgoIso(3).toISOString(),
    },
    {
      id: "demo-post-thong-bao-ho-so",
      slug: "demo-thong-bao-lich-tiep-nhan-ho-so-dot-2",
      title: "Thông báo: Lịch tiếp nhận hồ sơ xét tuyển đợt 2 năm 2026",
      excerpt: "Phòng Tuyển sinh tiếp nhận hồ sơ từ thứ Hai đến thứ Bảy, sáng 7h30–11h30, chiều 13h30–17h00.",
      content:
        "Phòng Tuyển sinh thông báo lịch tiếp nhận hồ sơ xét tuyển đợt 2:\n\n- **Thời gian:** thứ Hai – thứ Bảy, sáng 7h30–11h30, chiều 13h30–17h00\n- **Địa điểm:** Phòng Tuyển sinh, tầng 1 nhà A\n- **Hồ sơ:** xem danh sách tại trang Tuyển sinh\n\n*(Thông báo demo — dữ liệu thử nghiệm giao diện.)*",
      status: "published",
      isPinned: 1,
      categoryId: cat("tuyen-sinh"),
      publishedAt: daysAgoIso(1).toISOString(),
    },
    {
      id: "demo-post-thong-bao-kham-suc-khoe",
      slug: "demo-thong-bao-kham-suc-khoe-dau-khoa",
      title: "Thông báo: Kế hoạch khám sức khoẻ đầu khoá cho tân sinh viên",
      excerpt: "Tân sinh viên khoá 2026 khám sức khoẻ theo lịch từng lớp, mang theo CCCD và giấy báo nhập học.",
      content:
        "Tân sinh viên khoá 2026 khám sức khoẻ đầu khoá theo lịch từng lớp. Khi đến khám cần mang theo:\n\n1. Căn cước công dân\n2. Giấy báo nhập học\n3. Sổ khám sức khoẻ (nếu có)\n\n*(Thông báo demo — dữ liệu thử nghiệm giao diện.)*",
      status: "published",
      isPinned: 1,
      categoryId: cat("dao-tao"),
      publishedAt: daysAgoIso(2).toISOString(),
    },
  ];
  await db.insert(s.posts).values(newPosts);
  manifest.created.posts = newPosts.map((p) => p.id!);
  await save();

  // ===== Sự kiện: ảnh bìa cho 2 sự kiện có sẵn + 2 sự kiện sắp diễn ra mới
  const events = await db.query.events.findMany();
  const eAdvice = events.find((e) => e.title.startsWith("Ngày hội tư vấn"));
  const eGrad = events.find((e) => e.title.startsWith("Lễ tốt nghiệp"));
  if (eAdvice) await patch("events", eAdvice.id, "coverImageUrl", url("g-tan-sinh-vien"));
  if (eGrad) await patch("events", eGrad.id, "coverImageUrl", url("event-phat-bieu"));
  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth() + 1;
  const newEvents: (typeof s.events.$inferInsert)[] = [
    {
      id: "demo-event-hoi-thao-duoc",
      slug: "demo-hoi-thao-nghe-duoc-ky-nguyen-so",
      title: "Hội thảo: Nghề Dược trong kỷ nguyên số",
      description: "Chia sẻ về xu hướng nhà thuốc số hoá, quản lý kho thuốc bằng phần mềm và cơ hội việc làm cho dược sĩ cao đẳng.\n\n*(Sự kiện demo.)*",
      location: "Hội trường A",
      startAt: vnIso(year, month + (new Date().getUTCDate() > 20 ? 1 : 0), 25, 8),
      coverImageUrl: url("g-kinh-hien-vi"),
    },
    {
      id: "demo-event-mo-phong",
      slug: "demo-ngay-hoi-trai-nghiem-phong-mo-phong",
      title: "Ngày hội trải nghiệm phòng thực hành mô phỏng",
      description: "Học sinh THPT được trực tiếp thử các kỹ năng điều dưỡng cơ bản trên mô hình dưới sự hướng dẫn của giảng viên.\n\n*(Sự kiện demo.)*",
      location: "Khu thực hành tầng 3",
      startAt: vnIso(year, month + 2, 8, 8),
      coverImageUrl: url("g-mo-phong"),
    },
  ];
  await db.insert(s.events).values(newEvents);
  manifest.created.events = newEvents.map((e) => e.id!);
  await save();

  // ===== Thư viện ảnh Trang chủ (bento 5 ô)
  const gallery: (typeof s.galleryItems.$inferInsert)[] = [
    { id: "demo-gallery-1", imageUrl: url("g-nem-mu"), caption: "Khoảnh khắc lễ tốt nghiệp", sortOrder: 0 },
    { id: "demo-gallery-2", imageUrl: url("g-mo-phong"), caption: "Phòng thực hành mô phỏng", sortOrder: 1 },
    { id: "demo-gallery-3", imageUrl: url("g-kinh-hien-vi"), caption: "Thực hành xét nghiệm", sortOrder: 2 },
    { id: "demo-gallery-4", imageUrl: url("g-tan-sinh-vien"), caption: "Tân sinh viên khoá mới", sortOrder: 3 },
    { id: "demo-gallery-5", imageUrl: url("g-dung-cu"), caption: "Kỹ năng điều dưỡng cơ bản", sortOrder: 4 },
  ];
  await db.insert(s.galleryItems).values(gallery);
  manifest.created.gallery = gallery.map((g) => g.id!);
  await save();

  // ===== Ảnh chân dung cho 4 giảng viên có sẵn (theo vị trí hiển thị)
  const faculty = await db.query.faculty.findMany({ orderBy: (f, { asc }) => [asc(f.sortOrder), asc(f.seq)] });
  for (const [i, f] of faculty.slice(0, 4).entries()) {
    await patch("faculty", f.id, "photoUrl", url(`gv-${i + 1}`));
  }

  // ===== Học phí demo cho các ngành (để thấy cột Học phí; mặc định web hiện "Liên hệ")
  const tuitionBySlug: Record<string, string> = {
    "dieu-duong": "1.600.000đ/tháng",
    duoc: "1.700.000đ/tháng",
    "xet-nghiem-y-hoc": "1.650.000đ/tháng",
    "ho-sinh": "1.600.000đ/tháng",
    "phuc-hoi-chuc-nang": "1.600.000đ/tháng",
    "y-si-da-khoa": "1.750.000đ/tháng",
  };
  for (const p of await db.query.programs.findMany()) {
    if (tuitionBySlug[p.slug] && !p.tuition) await patch("programs", p.id, "tuition", tuitionBySlug[p.slug]);
  }

  // ===== Mốc thời gian tuyển sinh (thay placeholder bằng ngày demo)
  const timelineMeta = [`01/03 – 31/12/${year}`, "Trong 1–2 ngày làm việc", `Trước 30/11/${year}`, `Từ 15/12/${year}`];
  const timeline = await db.query.admissionItems.findMany({
    where: eq(s.admissionItems.type, "timeline"),
    orderBy: (a, { asc }) => [asc(a.sortOrder), asc(a.seq)],
  });
  for (const [i, item] of timeline.entries()) {
    if (timelineMeta[i]) await patch("admissionItems", item.id, "meta", timelineMeta[i]);
  }
  await save();

  // ===== Hồ sơ tuyển sinh rải 30 ngày (biểu đồ Dashboard) + tin nhắn + email nhận tin
  const programNames = (await db.query.programs.findMany()).map((p) => p.name);
  const names = [
    "Nguyễn Thu Hà", "Trần Minh Khang", "Lê Bảo Ngọc", "Phạm Gia Huy", "Hoàng Thảo Vy", "Đặng Quốc Bảo",
    "Bùi Thanh Tâm", "Võ Ngọc Ánh", "Đỗ Hải Nam", "Ngô Phương Linh", "Dương Tuấn Kiệt", "Lý Mai Anh",
    "Hồ Đức Thịnh", "Mai Khánh Linh", "Trịnh Hoàng Long", "Đinh Thu Trang", "Tạ Minh Châu", "Cao Nhật Minh",
    "Lương Bích Ngọc", "Vương Anh Tuấn", "Kiều Thanh Mai", "Phan Gia Bảo",
  ];
  // Lệch về ngành Điều dưỡng/Dược + tăng dần gần đây để biểu đồ trông giống thật.
  const days = [29, 27, 26, 24, 22, 21, 19, 18, 16, 14, 13, 12, 10, 9, 8, 6, 5, 4, 3, 2, 1, 0];
  const statuses = ["contacted", "contacted", "reviewed", "contacted", "reviewed", "contacted", "reviewed", "contacted", "reviewed", "contacted", "reviewed", "reviewed", "contacted", "reviewed", "new", "reviewed", "new", "new", "reviewed", "new", "new", "new"];
  const weights = [0, 1, 0, 2, 0, 1, 3, 0, 4, 0, 1, 5, 0, 1, 2, 0, 3, 0, 1, 0, 4, 5];
  const admissions = names.map((fullName, i) => ({
    id: `demo-admission-${i + 1}`,
    fullName,
    phone: `0900000${String(101 + i).padStart(3, "0")}`,
    idNumber: `00109900${String(1000 + i).padStart(4, "0")}`,
    email: i % 3 === 0 ? `demo.thisinh${i + 1}@example.com` : null,
    program: programNames[weights[i] % programNames.length] ?? "Điều dưỡng",
    note: i % 4 === 0 ? "Em muốn hỏi thêm về học bổng và ký túc xá. (dữ liệu demo)" : null,
    status: statuses[i],
    createdAt: dbTs(daysAgoIso(days[i], 1 + (i % 10))),
  }));
  await db.insert(s.admissionSubmissions).values(admissions);
  manifest.created.admissions = admissions.map((a) => a.id);

  const contacts = [
    { id: "demo-contact-1", name: "Phụ huynh Nguyễn Văn Tài", phone: "0900000201", email: null, message: "Cho tôi hỏi trường có ký túc xá cho sinh viên năm nhất không? (demo)", status: "new", createdAt: dbTs(daysAgoIso(0, 2)) },
    { id: "demo-contact-2", name: "Lê Thị Hồng", phone: null, email: "demo.hong@example.com", message: "Ngành Dược học mấy năm và có liên thông lên đại học không ạ? (demo)", status: "new", createdAt: dbTs(daysAgoIso(1, 8)) },
    { id: "demo-contact-3", name: "Trần Quốc Việt", phone: "0900000203", email: null, message: "Em muốn đăng ký tham quan phòng thực hành. (demo)", status: "read", createdAt: dbTs(daysAgoIso(4, 4)) },
  ];
  await db.insert(s.contactMessages).values(contacts);
  manifest.created.contacts = contacts.map((c) => c.id);

  const subscribers = ["demo.ban.tin1@example.com", "demo.ban.tin2@example.com", "demo.ban.tin3@example.com"].map((email, i) => ({
    id: `demo-newsletter-${i + 1}`,
    email,
    createdAt: dbTs(daysAgoIso(i * 3, 5)),
  }));
  await db.insert(s.newsletterSubscribers).values(subscribers).onConflictDoNothing();
  manifest.created.newsletter = subscribers.map((n) => n.id);
  await loadExtras(manifest);
  await save();

  console.log(`\n✓ Đã nạp dữ liệu demo. Ghi chú các thay đổi: ${path.relative(process.cwd(), MANIFEST)}`);
  console.log("  Xoá: npm run demo:clean");
}

async function clean() {
  const manifest: Manifest | null = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : null;
  if (manifest) {
    const c = manifest.created;
    if (c.posts.length) await db.delete(s.posts).where(inArray(s.posts.id, c.posts));
    if (c.events.length) await db.delete(s.events).where(inArray(s.events.id, c.events));
    if (c.gallery.length) await db.delete(s.galleryItems).where(inArray(s.galleryItems.id, c.gallery));
    if (c.admissions.length) await db.delete(s.admissionSubmissions).where(inArray(s.admissionSubmissions.id, c.admissions));
    if (c.contacts.length) await db.delete(s.contactMessages).where(inArray(s.contactMessages.id, c.contacts));
    if (c.newsletter.length) await db.delete(s.newsletterSubscribers).where(inArray(s.newsletterSubscribers.id, c.newsletter));
    if (c.milestones?.length) await db.delete(s.milestones).where(inArray(s.milestones.id, c.milestones));
    // Trả giá trị gốc theo thứ tự ngược (field sửa nhiều lần vẫn về đúng giá trị ban đầu).
    for (const r of [...manifest.restored].reverse()) {
      const t = TABLES[r.table] as unknown as typeof s.posts;
      await db.update(t).set({ [r.field]: r.value } as Partial<typeof s.posts.$inferInsert>).where(eq(t.id, r.id));
    }
  }
  const restoredIds = new Set(manifest?.restored.map((r) => r.id) ?? []);
  const keep = [...restoredIds];

  // Bản ghi tạo tay qua admin bằng ảnh demo → cũng là dữ liệu demo.
  await db.delete(s.heroBanners).where(like(s.heroBanners.imageUrl, `${DEMO_URL_PREFIX}%`));
  await db.delete(s.galleryItems).where(like(s.galleryItems.imageUrl, `${DEMO_URL_PREFIX}%`));
  await db.delete(s.milestones).where(like(s.milestones.imageUrl, `${DEMO_URL_PREFIX}%`));
  // Banner trang con / ảnh ngành chọn tay trong admin bằng ảnh demo → gỡ (ảnh sắp bị xoá bên dưới).
  await db.update(s.siteSettings).set({ pageBannerUrl: null }).where(like(s.siteSettings.pageBannerUrl, `${DEMO_URL_PREFIX}%`));
  await db.update(s.programs).set({ imageUrl: null }).where(like(s.programs.imageUrl, `${DEMO_URL_PREFIX}%`));
  await db.delete(s.pageBanners).where(like(s.pageBanners.imageUrl, `${DEMO_URL_PREFIX}%`));
  await db.update(s.pages).set({ coverImageUrl: null }).where(like(s.pages.coverImageUrl, `${DEMO_URL_PREFIX}%`));
  await db
    .delete(s.posts)
    .where(keep.length ? and(like(s.posts.coverImageUrl, `${DEMO_URL_PREFIX}%`), notInArray(s.posts.id, keep)) : like(s.posts.coverImageUrl, `${DEMO_URL_PREFIX}%`));
  await db
    .delete(s.events)
    .where(keep.length ? and(like(s.events.coverImageUrl, `${DEMO_URL_PREFIX}%`), notInArray(s.events.id, keep)) : like(s.events.coverImageUrl, `${DEMO_URL_PREFIX}%`));

  // Ảnh do script tải: "demo-*.jpg". Tệp thử tải lên qua form admin (saveUploadedFile
  // thêm tiền tố thời gian): "<timestamp>-demo-*". Không đụng file nào khác.
  const isDemoFile = (name: string) => /^(demo-|\d{10,}-demo-)/.test(name);
  const demoMedia = (await db.query.mediaItems.findMany()).filter((m) => isDemoFile(m.filename));
  if (demoMedia.length) await db.delete(s.mediaItems).where(inArray(s.mediaItems.id, demoMedia.map((m) => m.id)));
  if (existsSync(UPLOADS)) {
    for (const f of await readdir(UPLOADS)) if (isDemoFile(f)) await unlink(path.join(UPLOADS, f));
  }
  if (manifest) await unlink(MANIFEST);
  console.log("✓ Đã xoá dữ liệu demo và trả lại giá trị gốc.");
}

const command = process.argv[2];
(command === "clean" ? clean() : command === "load" ? load() : Promise.reject(new Error("Dùng: demo-data.ts load | clean")))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDb);
