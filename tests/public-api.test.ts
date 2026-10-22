import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "../src/lib/db/client";
import * as schema from "../src/lib/db/schema";

let admission: typeof import("../src/app/api/admissions/route");
let lookup: typeof import("../src/app/api/admissions/tra-cuu/route");
let contact: typeof import("../src/app/api/contact/route");
let newsletter: typeof import("../src/app/api/newsletter/route");
let health: typeof import("../src/app/api/health/route");
let database: typeof import("../src/lib/db");
let pglite: PGlite;
let requestId = 0;

before(async () => {
  process.env.TURNSTILE_SECRET_KEY = "";
  process.env.RESEND_API_KEY = "";
  process.env.TRUST_PROXY_HOPS = "1";
  // Postgres thật chạy trong bộ nhớ (PGlite) với đúng migration của dự án — không cần
  // Docker, không đụng DB dev. Gắn TRƯỚC khi import code app (xem __testDb trong client.ts).
  pglite = new PGlite();
  const testDb = drizzle(pglite, { schema });
  await migrate(testDb, { migrationsFolder: "./drizzle" });
  globalThis.__testDb = testDb as unknown as Database;
  database = await import("../src/lib/db");
  await database.db.insert(database.schema.programs).values({
    slug: "dieu-duong", code: "DD", name: "Điều dưỡng", nameEn: "Nursing",
    duration: "3 năm", intake: 100, summary: "Nội dung thử nghiệm",
  });
  await database.db.insert(database.schema.siteSettings).values({
    id: "main", hotline: "0901234567", email: "", address: "Địa chỉ thử nghiệm", announcement: "",
  });
  admission = await import("../src/app/api/admissions/route");
  lookup = await import("../src/app/api/admissions/tra-cuu/route");
  contact = await import("../src/app/api/contact/route");
  newsletter = await import("../src/app/api/newsletter/route");
  health = await import("../src/app/api/health/route");
});

after(async () => {
  await pglite.close();
});

function request(body: unknown, raw = false) {
  return new Request("http://localhost/api/test", {
    method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${++requestId}` },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

const payload = { fullName: "  Người kiểm thử  ", phone: "090 123-4567", idNumber: "038201001234", email: " TEST@EXAMPLE.COM ", program: "dieu-duong", note: "" };

test("bốn API từ chối JSON hỏng và body sai kiểu bằng 400", async () => {
  for (const route of [admission, lookup, contact, newsletter]) {
    for (const body of ["{", "null", "[]"]) {
      const response = await route.POST(request(body, true));
      assert.equal(response.status, 400);
      assert.equal((await response.json()).ok, false);
    }
  }
});

test("giới hạn kích thước áp dụng tại cả bốn API", async () => {
  for (const route of [admission, lookup, contact, newsletter]) {
    const response = await route.POST(request({ note: "x".repeat(33 * 1024) }));
    assert.equal(response.status, 413);
  }
});

test("ngành giả không tạo hồ sơ; số CCCD và field sai kiểu bị từ chối", async () => {
  for (const invalid of [{ ...payload, program: "khong-ton-tai" }, { ...payload, idNumber: "123" }, { ...payload, fullName: {} }]) {
    assert.equal((await admission.POST(request(invalid))).status, 400);
  }
  assert.equal((await database.db.query.admissionSubmissions.findMany()).length, 0);
});

test("đăng ký bằng slug, tên VI và EN lưu ngành chuẩn, tra cứu được và không lộ liên hệ", async () => {
  for (const program of ["dieu-duong", "Điều dưỡng", "Nursing"]) {
    const response = await admission.POST(request({ ...payload, program }));
    assert.equal(response.status, 200);
    assert.ok((await response.json()).id);
  }
  const rows = await database.db.query.admissionSubmissions.findMany();
  assert.equal(rows.length, 3);
  assert.equal(rows[0].fullName, "Người kiểm thử");
  assert.equal(rows[0].phone, "0901234567");
  assert.equal(rows[0].email, "test@example.com");
  assert.ok(rows.every((row) => row.program === "Điều dưỡng"));
  const response = await lookup.POST(request({ idNumber: "038 201 001 234" }));
  const data = await response.json();
  assert.equal(data.results.length, 3);
  assert.equal(data.results[0].statusLabel, "Đã tiếp nhận, đang chờ xét duyệt");
  assert.equal("phone" in data.results[0], false);
  assert.equal("email" in data.results[0], false);
});

test("liên hệ hợp lệ với field tuỳ chọn trống được lưu; object bị từ chối", async () => {
  assert.equal((await contact.POST(request({ name: " Bạn đọc ", message: " Xin tư vấn ", phone: "", email: "" }))).status, 200);
  assert.equal((await contact.POST(request({ name: "Bạn đọc", message: {} }))).status, 400);
  const rows = await database.db.query.contactMessages.findMany();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].message, "Xin tư vấn");
});

test("newsletter chuẩn hoá email và không tạo bản ghi trùng", async () => {
  for (const email of [" HELLO@EXAMPLE.COM ", "hello@example.com"]) {
    assert.equal((await newsletter.POST(request({ email }))).status, 200);
  }
  assert.equal((await newsletter.POST(request({ email: 123 }))).status, 400);
  assert.equal((await database.db.query.newsletterSubscribers.findMany()).length, 1);
  const responses = await Promise.all(Array.from({ length: 3 }, () => newsletter.POST(request({ email: "parallel@example.com" }))));
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal((await database.db.query.newsletterSubscribers.findMany()).length, 2);
});

test("Postgres: created_at mặc định giữ định dạng SQLite cũ; sửa 1 dòng không làm đổi thứ tự khi trùng sortOrder", async () => {
  const { db, schema: s } = database;
  const { asc, eq } = await import("drizzle-orm");
  const [first] = await db.query.contactMessages.findMany();
  assert.match(first.createdAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

  await db.insert(s.faqs).values(["A", "B", "C"].map((question) => ({ question, answer: "x" })));
  await db.update(s.faqs).set({ answer: "đã sửa" }).where(eq(s.faqs.question, "A"));
  const order = await db.query.faqs.findMany({ orderBy: [asc(s.faqs.sortOrder), asc(s.faqs.seq)] });
  assert.deepEqual(order.map((f) => f.question), ["A", "B", "C"]);
});

test("honeypot không ghi dữ liệu; giới hạn tần suất vẫn có hiệu lực", async () => {
  const response = await admission.POST(request({ ...payload, website: "https://bot.test" }));
  assert.equal((await response.json()).id, "ignored");
  assert.equal((await database.db.query.admissionSubmissions.findMany()).length, 3);
  for (let index = 0; index < 6; index++) {
    const result = await admission.POST(new Request("http://localhost/api/admissions", {
      method: "POST", headers: { "x-forwarded-for": "198.51.100.1" }, body: "{}",
    }));
    assert.equal(result.status, index < 5 ? 400 : 429);
  }
});

test("/api/health báo ok khi CSDL trả lời, thư mục upload ghi được, ổ đĩa còn trống; không cache", async () => {
  const response = await health.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.status, "ok");
  assert.deepEqual(data.checks, { database: "ok", uploads: "ok", disk: "ok" });
});

test("/api/health trả 503 khi ổ đĩa còn trống ít hơn ngưỡng", async () => {
  process.env.HEALTH_MIN_FREE_MB = String(Number.MAX_SAFE_INTEGER);
  try {
    const response = await health.GET();
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.equal(data.status, "error");
    assert.equal(data.checks.disk, "error");
    assert.equal(data.checks.database, "ok");
  } finally {
    delete process.env.HEALTH_MIN_FREE_MB;
  }
});
