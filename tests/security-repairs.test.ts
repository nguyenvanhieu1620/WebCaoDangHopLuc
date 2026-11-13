import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/lib/db/schema";
import { checkUpload, uploadKindOf } from "../src/lib/upload-rules";
import { contentMatchesType, EXTENSION_BY_MIME } from "../src/lib/file-signature";
import { isProductionSeed } from "../src/lib/db/script-guard";
import { uploadedFilePath, UPLOAD_DIR } from "../src/lib/upload-dir";
import { DEMO_ADMIN_PASSWORD } from "../src/lib/demo-credentials";
import { safeHref } from "../src/lib/safe-href";
import { checkRateLimit } from "../src/lib/rate-limit";
import { formatDbDateTime, hasPlaceholder, normalizeExternalUrl, normalizeSearch, slugify, staticPageHref, videoSource, vnDateKey, vnDatetimeLocalToISO } from "../src/lib/utils";
import { pickLocale, type Locale } from "../src/lib/locale";
import * as contactStatus from "../src/app/admin/(dashboard)/lien-he/status";
import { filterContactMessages, parseContactFilters } from "../src/app/admin/(dashboard)/lien-he/filter";
import * as csv from "../src/lib/csv";
import { MENU_HAS_CHILDREN_ERROR, MENU_HREF_ERROR } from "../src/app/admin/(dashboard)/menu/validation";
import {
  captureFacultyDraft, facultyDraftChanges, isFacultyDraftToken, parseFacultyDraft, removeSavedFacultyDraft,
} from "../src/app/admin/(dashboard)/giang-vien/draft";

// Chạy đúng module/action với DB, email và Next được thay bằng fixture; không chạm DB dev.
function loadModule<T>(file: string, mocks: Record<string, unknown>, globals: Record<string, unknown> = {}): T {
  const filename = path.resolve(file);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const moduleResult = { exports: {} };
  const actualRequire = createRequire(filename);
  vm.runInNewContext(output, {
    module: moduleResult, exports: moduleResult.exports, console, Buffer, FormData, File,
    process: { env: { NODE_ENV: "production" } },
    require: (id: string) => Object.hasOwn(mocks, id) ? mocks[id] : actualRequire(id),
    ...globals,
  }, { filename, timeout: 5000 });
  return moduleResult.exports as T;
}

function facultySaveFixture(options: {
  permissionError?: Error;
  databaseError?: Error;
  photoError?: Error;
  missing?: boolean;
  deletedDuringSave?: boolean;
} = {}) {
  const effects: string[] = [];
  let redirectedTo = "";
  const redirectError = new Error("NEXT_REDIRECT");
  const listQuery = loadModule<typeof import("../src/app/admin/(dashboard)/giang-vien/list-query")>(
    "src/app/admin/(dashboard)/giang-vien/list-query.ts", { "./draft": { isFacultyDraftToken } }, { URLSearchParams }
  );
  const action = loadModule<typeof import("../src/app/admin/(dashboard)/giang-vien/actions")>(
    "src/app/admin/(dashboard)/giang-vien/actions.ts", {
      "next/cache": { revalidatePath: () => { effects.push("cache"); } },
      "next/navigation": { redirect: (href: string) => { redirectedTo = href; throw redirectError; } },
      "@/lib/admin-auth": { requirePermission: async () => {
        effects.push("authorize");
        if (options.permissionError) throw options.permissionError;
      } },
      "@/lib/db": { schema: { faculty: { id: "id" } }, db: {
        query: { faculty: { findFirst: async () => {
          if (options.databaseError) throw options.databaseError;
          return options.missing ? null : { id: "fixture", photoUrl: "/uploads/existing.png" };
        } } },
        update: () => ({ set: () => ({ where: () => ({ returning: async () => {
          effects.push("update");
          return options.deletedDuringSave ? [] : [{ id: "fixture" }];
        } }) }) }),
      } },
      "drizzle-orm": { eq: () => ({}) },
      "@/lib/media": { resolveImageUrl: async () => {
        effects.push("photo");
        if (options.photoError) throw options.photoError;
        return "/uploads/existing.png";
      } },
      "@/lib/translate": { autoFillTranslations: async (pairs: { en: string }[]) => pairs.map((pair) => pair.en) },
      "@/lib/utils": { slugify: () => "fixture" },
      "./list-query": listQuery,
    }, { console: { error: () => {} } }
  );
  const data = new FormData();
  data.set("id", "fixture");
  data.set("name", "Giảng viên thử");
  data.set("role", "Giảng viên");
  return { action, data, effects, redirectError, destination: () => redirectedTo };
}

test("giảng viên trả lỗi từng ô trước khi xử lý ảnh hoặc ghi dữ liệu", async () => {
  const fixture = facultySaveFixture();
  fixture.data.set("name", "  ");
  fixture.data.set("role", "");
  fixture.data.set("sortOrder", "2147483648");
  const result = await fixture.action.upsertFacultyAction({}, fixture.data);
  assert.ok(result.fields?.name);
  assert.ok(result.fields?.role);
  assert.ok(result.fields?.sortOrder);
  assert.deepEqual(fixture.effects, ["authorize"]);
});

test("lỗi ảnh hoặc DB trả phản hồi an toàn, không chuyển sang thông báo đã lưu", async () => {
  const photo = facultySaveFixture({ photoError: new Error("private filesystem path") });
  const photoResult = await photo.action.upsertFacultyAction({}, photo.data);
  assert.ok(photoResult.fields?.photo);
  assert.equal(photo.effects.includes("update"), false);
  assert.equal(photo.destination(), "");
  assert.equal(JSON.stringify(photoResult).includes("private filesystem"), false);

  const database = facultySaveFixture({ databaseError: new Error("private connection details") });
  const databaseResult = await database.action.upsertFacultyAction({}, database.data);
  assert.ok(databaseResult.message);
  assert.equal(database.destination(), "");
  assert.equal(JSON.stringify(databaseResult).includes("private connection"), false);
});

test("hồ sơ mất trước hoặc trong khi lưu không được báo đã lưu thành công", async () => {
  for (const options of [{ missing: true }, { deletedDuringSave: true }]) {
    const fixture = facultySaveFixture(options);
    const result = await fixture.action.upsertFacultyAction({}, fixture.data);
    assert.ok(result.message);
    assert.equal(fixture.destination(), "");
    assert.equal(fixture.effects.includes("cache"), false);
  }
});

test("phân quyền và chuyển trang sau khi lưu giảng viên không bị khối bắt lỗi nuốt mất", async () => {
  const denied = new Error("NEXT_REDIRECT permission");
  const unauthorized = facultySaveFixture({ permissionError: denied });
  await assert.rejects(unauthorized.action.upsertFacultyAction({}, unauthorized.data), (error) => error === denied);
  assert.deepEqual(unauthorized.effects, ["authorize"]);

  const saved = facultySaveFixture();
  const draftToken = "a".repeat(32);
  saved.data.set("facultyDraftToken", draftToken);
  await assert.rejects(saved.action.upsertFacultyAction({ q: "tên & khoa", department: "unassigned", page: "2" }, saved.data), (error) => error === saved.redirectError);
  const url = new URL(saved.destination(), "https://fixture.test");
  assert.equal(url.pathname, "/admin/giang-vien");
  assert.equal(url.searchParams.get("q"), "tên & khoa");
  assert.equal(url.searchParams.get("department"), "unassigned");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("saved"), "1");
  assert.equal(url.searchParams.get("draft"), draftToken);
});

test("bản tạm giữ nội dung và lựa chọn, bỏ định danh và tệp tải từ máy", () => {
  const data = new FormData();
  data.set("name", "Giảng viên thử");
  data.set("bioEn", "English bio");
  data.set("departmentId", "department");
  data.set("photoExisting", "/uploads/existing.png");
  data.set("id", "do-not-restore");
  data.set("photo", new File(["test photo bytes"], "portrait.png", { type: "image/png" }));
  const draft = captureFacultyDraft(data);
  assert.deepEqual(draft.values, {
    name: "Giảng viên thử", departmentId: "department", bioEn: "English bio", photoExisting: "/uploads/existing.png",
  });
  assert.equal(draft.reselectPhoto, true);
  assert.deepEqual(facultyDraftChanges(
    { values: { name: "Giảng viên thử", departmentId: "old" }, reselectPhoto: false },
    draft,
  ).values, { departmentId: "department", bioEn: "English bio", photoExisting: "/uploads/existing.png" });
  const now = Date.now();
  const raw = JSON.stringify({ ...draft, savedAt: now, version: "original" });
  assert.equal(parseFacultyDraft(raw, now)?.version, "original");
  assert.equal(parseFacultyDraft(raw, now + 24 * 60 * 60 * 1000), null);
  assert.equal(parseFacultyDraft("{invalid", now), null);
});

test("lưu thành công chỉ dọn đúng bản tạm đã gửi của tài khoản hiện tại", () => {
  const token = "c".repeat(32);
  const submitted = JSON.stringify({ version: "original", savedAt: Date.now(), values: { name: "Submitted" }, token });
  const newer = JSON.stringify({ version: "original", savedAt: Date.now(), values: { name: "Newer" } });
  const entries = new Map([
    ["hopluc-faculty:a:profile:1", submitted],
    ["hopluc-faculty:a:profile:2", newer],
    ["hopluc-faculty:b:profile:1", submitted],
    ["hopluc-post:a:profile:1", submitted],
  ]);
  const storage = {
    get length() { return entries.size; },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    removeItem: (key: string) => { entries.delete(key); },
  };
  removeSavedFacultyDraft(storage, "a", token);
  assert.equal(entries.has("hopluc-faculty:a:profile:1"), false);
  assert.equal(entries.get("hopluc-faculty:a:profile:2"), newer);
  assert.equal(entries.get("hopluc-faculty:b:profile:1"), submitted);
  assert.equal(entries.get("hopluc-post:a:profile:1"), submitted);
  entries.set("hopluc-faculty:a:profile:1", newer);
  removeSavedFacultyDraft(storage, "a", token);
  assert.equal(entries.get("hopluc-faculty:a:profile:1"), newer);
});

function mediaFixture() {
  const writes: { filename: string; options: { flag: string } }[] = [];
  const media = loadModule<typeof import("../src/lib/media")>("src/lib/media.ts", {
    "node:fs/promises": { mkdir: async () => {}, writeFile: async (filename: string, _data: unknown, options: { flag: string }) => { writes.push({ filename, options }); } },
    "@/lib/db": { db: { insert: () => ({ values: async () => {} }) }, schema: { mediaItems: {} } },
    "@/lib/utils": { slugify: () => "image", normalizeExternalUrl: () => null, videoSource: () => null },
    "@/lib/upload-rules": { checkUpload: () => null, uploadKindOf: () => "image" },
    "@/lib/upload-dir": { UPLOAD_DIR: "/scratch/uploads" },
    "@/lib/file-signature": { contentMatchesType: () => true, EXTENSION_BY_MIME: { "image/png": ".png" } },
  });
  return { media, writes };
}

test("FAQ tạm ẩn vẫn lưu bản soạn và bị loại khỏi danh sách công khai lẫn tìm kiếm Việt/Anh", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    await db.insert(schema.faqs).values({ id: "faq-default", question: "Câu hỏi mặc định", answer: "Câu trả lời" });
    let locale: Locale = "vi";
    const dependencies = {
      "@/lib/db": { db, schema },
      "@/lib/locale": { getLocale: async () => locale, pickLocale },
    };
    const { getFaqs } = loadModule<typeof import("../src/lib/data/faqs")>("src/lib/data/faqs.ts", dependencies);
    const { searchSite } = loadModule<typeof import("../src/lib/data/search")>("src/lib/data/search.ts", {
      ...dependencies, "@/lib/utils": { hasPlaceholder, normalizeSearch, staticPageHref },
    });
    const redirectError = new Error("NEXT_REDIRECT");
    const revalidated = new Set<string>();
    const { upsertFaqAction } = loadModule<typeof import("../src/app/admin/(dashboard)/faq/actions")>(
      "src/app/admin/(dashboard)/faq/actions.ts", {
        "@/lib/db": { db, schema },
        "@/lib/admin-auth": { requirePermission: async (permission: string) => assert.equal(permission, "faq") },
        "@/lib/translate": { autoFillTranslations: async (pairs: { en: string }[]) => pairs.map((pair) => pair.en) },
        "next/cache": { revalidatePath: (path: string) => { revalidated.add(path); } },
        "next/navigation": { redirect: () => { throw redirectError; } },
      },
    );
    const form = new FormData();
    form.set("question", "Câu hỏi KIEMTHU91");
    form.set("answer", "   ");
    form.set("questionEn", "Question ENFAQ91");
    form.set("answerEn", "English answer");
    form.set("isVisible", "0");
    assert.equal((await upsertFaqAction(form)).fields?.answer, "Nhập câu trả lời.");
    assert.equal((await db.select().from(schema.faqs)).length, 1);
    assert.equal(revalidated.size, 0);

    form.set("answer", "Bản soạn tiếng Việt");
    await assert.rejects(upsertFaqAction(form), (error) => error === redirectError);
    const hidden = (await db.select().from(schema.faqs)).find((item) => item.isVisible === 0);
    assert.ok(hidden);
    assert.equal(hidden.answerEn, "English answer");
    assert.deepEqual([...(await getFaqs())].map((item) => item.id), ["faq-default"]);
    assert.equal((await searchSite("KIEMTHU91")).length, 0);
    locale = "en";
    assert.equal((await searchSite("ENFAQ91")).length, 0);

    form.set("id", hidden.id);
    form.set("isVisible", "1");
    await assert.rejects(upsertFaqAction(form), (error) => error === redirectError);
    assert.equal((await getFaqs()).find((item) => item.id === hidden.id)?.question, "Question ENFAQ91");
    assert.equal((await searchSite("ENFAQ91"))[0]?.href, `/faq?cau-hoi=${hidden.id}#cau-hoi`);
    locale = "vi";
    assert.equal((await searchSite("KIEMTHU91"))[0]?.type, "faq");
    assert.deepEqual([...revalidated], ["/admin/faq", "/faq", "/tuyen-sinh", "/tim-kiem"]);
  } finally {
    await pg.close();
  }
});

test("menu giữ đúng hai cấp khi đổi cha và báo lỗi đường dẫn trước khi ghi", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    const href = "/nganh-dao-tao";
    await db.insert(schema.navItems).values([
      { id: "menu-root", label: "Ngành đào tạo", href },
      { id: "menu-target", label: "Tuyển sinh", href: "/tuyen-sinh" },
      { id: "menu-child", label: "Điều dưỡng", href, parentId: "menu-root" },
    ]);
    const redirectError = new Error("NEXT_REDIRECT");
    const { upsertNavItemAction, deleteNavItemAction } = loadModule<typeof import("../src/app/admin/(dashboard)/menu/actions")>(
      "src/app/admin/(dashboard)/menu/actions.ts", {
        "next/cache": { revalidatePath: () => {} },
        "next/navigation": { redirect: () => { throw redirectError; } },
        "@/lib/admin-auth": { requirePermission: async (permission: string) => assert.equal(permission, "menu") },
        "@/lib/db": { db, schema },
        "@/lib/safe-href": { safeHref },
        "@/lib/translate": { autoFillTranslations: async (pairs: { en: string }[]) => pairs.map((pair) => pair.en) },
        "./validation": { MENU_HAS_CHILDREN_ERROR, MENU_HREF_ERROR },
      },
    );
    const form = new FormData();
    form.set("id", "menu-root");
    form.set("label", "Ngành đào tạo mới");
    form.set("href", "nganh-dao-tao");
    form.set("parentId", "menu-target");
    assert.equal((await upsertNavItemAction(form)).fields?.href, MENU_HREF_ERROR);
    form.set("href", href);
    assert.equal((await upsertNavItemAction(form)).fields?.parentId, MENU_HAS_CHILDREN_ERROR);
    form.set("parentId", "menu-child");
    assert.ok((await upsertNavItemAction(form)).fields?.parentId);
    const before = await db.select().from(schema.navItems);
    assert.equal(before.find((item) => item.id === "menu-root")?.parentId, null);
    assert.equal(before.find((item) => item.id === "menu-child")?.parentId, "menu-root");

    form.set("id", "menu-child");
    form.set("parentId", "menu-target");
    await assert.rejects(upsertNavItemAction(form), (error) => error === redirectError);
    const after = await db.select().from(schema.navItems);
    assert.equal(after.find((item) => item.id === "menu-child")?.parentId, "menu-target");
    await deleteNavItemAction("menu-target");
    assert.deepEqual((await db.select({ id: schema.navItems.id }).from(schema.navItems)).map((item) => item.id), ["menu-root"]);
  } finally {
    await pg.close();
  }
});

test("trang tĩnh báo lỗi nội dung chỉ có dấu cách và slug sai trước khi lưu", async () => {
  const { upsertPageAction } = loadModule<typeof import("../src/app/admin/(dashboard)/trang-tinh/actions")>(
    "src/app/admin/(dashboard)/trang-tinh/actions.ts", {
      "next/cache": { revalidatePath: () => assert.fail("Không được làm mới dữ liệu khi form sai") },
      "next/navigation": { redirect: () => assert.fail("Không được chuyển trang khi form sai") },
      "@/lib/admin-auth": { requirePermission: async (permission: string) => assert.equal(permission, "pages") },
      "@/lib/db": { schema },
      "@/lib/utils": { slugify },
      "@/lib/media": { saveWithMedia: () => assert.fail("Không được ghi dữ liệu khi form sai") },
      "@/lib/translate": { autoFillTranslations: () => assert.fail("Không được dịch khi form sai") },
      "@/lib/upload-rules": { checkUpload },
    },
  );
  const form = new FormData();
  form.set("title", "Trang thử");
  form.set("content", "   ");
  form.set("slug", "-?- ");
  assert.deepEqual(Object.keys((await upsertPageAction(form)).fields ?? {}), ["content", "slug"]);

  form.set("slug", "  ");
  assert.deepEqual(Object.keys((await upsertPageAction(form)).fields ?? {}), ["content"]);
});

test("sự kiện từ chối tên trống, ngày không tồn tại và giờ kết thúc trước giờ bắt đầu", async () => {
  const { upsertEventAction } = loadModule<typeof import("../src/app/admin/(dashboard)/su-kien/actions")>(
    "src/app/admin/(dashboard)/su-kien/actions.ts", {
      "next/cache": { revalidatePath: () => assert.fail("Không được làm mới dữ liệu khi form sai") },
      "next/navigation": { redirect: () => assert.fail("Không được chuyển trang khi form sai") },
      "@/lib/admin-auth": { requirePermission: async (permission: string) => assert.equal(permission, "events") },
      "@/lib/db": { schema },
      "@/lib/utils": { vnDatetimeLocalToISO },
      "@/lib/media": { saveWithMedia: () => assert.fail("Không được ghi dữ liệu khi form sai") },
      "@/lib/translate": { autoFillTranslations: () => assert.fail("Không được dịch khi form sai") },
      "@/lib/upload-rules": { checkUpload },
    },
  );
  const form = new FormData();
  form.set("title", "   ");
  form.set("startAt", "2026-02-29T08:00");
  form.set("endAt", "2026-03-01T24:00");
  assert.deepEqual(Object.keys((await upsertEventAction(form)).fields ?? {}), ["title", "startAt", "endAt"]);

  form.set("title", "Sự kiện thử");
  form.set("startAt", "2028-02-29T00:30");
  form.set("endAt", "2028-02-28T23:30");
  assert.equal((await upsertEventAction(form)).fields?.endAt, "Thời gian kết thúc phải bằng hoặc sau thời gian bắt đầu.");
  assert.equal(vnDatetimeLocalToISO("2028-02-29T00:30"), "2028-02-28T17:30:00.000Z");
});

test("ngành đào tạo báo đúng ô lỗi trước khi dịch, tải ảnh hoặc ghi dữ liệu", async () => {
  const { upsertProgramAction } = loadModule<typeof import("../src/app/admin/(dashboard)/nganh-dao-tao/actions")>(
    "src/app/admin/(dashboard)/nganh-dao-tao/actions.ts", {
      "next/cache": { revalidatePath: () => assert.fail("Không được làm mới dữ liệu khi form sai") },
      "next/navigation": { redirect: () => assert.fail("Không được chuyển trang khi form sai") },
      "@/lib/admin-auth": { requirePermission: async (permission: string) => assert.equal(permission, "programs") },
      "@/lib/db": { schema },
      "@/lib/utils": {},
      "@/lib/media": { saveWithMedia: () => assert.fail("Không được ghi dữ liệu khi form sai") },
      "@/lib/translate": { autoFillTranslations: () => assert.fail("Không được dịch khi form sai") },
      "@/lib/upload-rules": { checkUpload },
    },
  );
  const form = new FormData();
  form.set("code", "   ");
  form.set("name", "Ngành thử");
  form.set("duration", "3 năm");
  form.set("summary", "Mô tả ngành.");
  form.set("intake", "10");
  form.set("image", new File(["%PDF-1.4"], "sample.pdf", { type: "application/pdf" }));
  assert.deepEqual(Object.keys((await upsertProgramAction(form)).fields ?? {}), ["code", "image"]);

  form.set("code", "QA-123");
  form.set("removeImage", "on");
  for (const intake of ["0", "-1", "1.5", "2147483648"]) {
    form.set("intake", intake);
    assert.deepEqual(Object.keys((await upsertProgramAction(form)).fields ?? {}), ["intake"]);
  }
});

test("bài viết báo lỗi từng ô, hủy ảnh đã ghi nếu tệp đính kèm lỗi và lưu đúng một bản nháp khi thử lại", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    const uploadDir = path.resolve("fixture", "uploads");
    const files = new Set<string>();
    const media = loadModule<typeof import("../src/lib/media")>("src/lib/media.ts", {
      "node:fs/promises": {
        mkdir: async () => {},
        writeFile: async (filename: string) => { files.add(filename); },
        unlink: async (filename: string) => { assert.ok(files.delete(filename)); },
      },
      "@/lib/db": { db, schema },
      "@/lib/utils": { slugify: () => "test-upload" },
      "@/lib/upload-rules": { checkUpload, uploadKindOf },
      "@/lib/upload-dir": {
        UPLOAD_DIR: uploadDir,
        uploadedFilePath: (url: string) => path.join(uploadDir, path.basename(url)),
      },
      "@/lib/file-signature": { contentMatchesType, EXTENSION_BY_MIME },
    });
    const redirectError = new Error("NEXT_REDIRECT");
    const action = loadModule<typeof import("../src/app/admin/(dashboard)/bai-viet/actions")>(
      "src/app/admin/(dashboard)/bai-viet/actions.ts", {
        "next/cache": { revalidatePath: () => {} },
        "next/navigation": { redirect: (href: string) => {
          assert.equal(href, "/admin/bai-viet?saved=1");
          throw redirectError;
        } },
        "@/lib/admin-auth": { requirePermission: async () => {} },
        "@/lib/db": { db, schema },
        "@/lib/utils": { slugify: () => "post-retry" },
        "@/lib/media": media,
        "@/lib/translate": { autoFillTranslations: async (pairs: { en: string }[]) => pairs.map((pair) => pair.en) },
        "@/lib/upload-rules": { checkUpload },
      }, { console: { error: () => {} } },
    );
    const form = new FormData();
    form.set("title", "   ");
    form.set("content", "Nội dung bản nháp.");
    form.set("contentEn", "Draft content.");
    form.set("coverImage", new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "cover.png", { type: "image/png" }));
    form.set("attachment", new File(["test without a PDF header"], "attachment.pdf", { type: "application/pdf" }));

    assert.ok((await action.upsertPostAction(form)).fields?.title);
    assert.equal(files.size, 0);

    form.set("title", "Bản nháp thử");
    assert.ok((await action.upsertPostAction(form)).fields?.attachment);
    assert.equal(files.size, 0);
    assert.equal((await db.select().from(schema.mediaItems)).length, 0);
    assert.equal((await db.select().from(schema.posts)).length, 0);

    form.set("attachment", new File(["%PDF-1.4\ntest"], "attachment.pdf", { type: "application/pdf" }));
    await assert.rejects(action.upsertPostAction(form), (error) => error === redirectError);
    const posts = await db.select().from(schema.posts);
    assert.equal(posts.length, 1);
    assert.equal(posts[0].status, "draft");
    assert.equal(posts[0].contentEn, "Draft content.");
    assert.equal(posts[0].attachmentName, "attachment.pdf");
    assert.equal(files.size, 2);
    assert.equal((await db.select().from(schema.mediaItems)).length, 2);
  } finally {
    await pg.close();
  }
});

test("lỗi ghi mục trải nghiệm dọn cả ảnh bìa lẫn video tải lên trước khi thử lại", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    await pg.exec("ALTER TABLE gallery_items ADD CONSTRAINT fixture_caption CHECK (caption <> 'Buộc lỗi ghi')");
    const files = new Set<string>();
    const media = loadModule<typeof import("../src/lib/media")>("src/lib/media.ts", {
      "node:fs/promises": {
        mkdir: async () => {},
        writeFile: async (filename: string) => { files.add(filename); },
        unlink: async (filename: string) => { files.delete(filename); },
      },
      "@/lib/db": { db, schema },
      "@/lib/utils": { normalizeExternalUrl, slugify, videoSource },
      "@/lib/upload-rules": { checkUpload, uploadKindOf },
      "@/lib/upload-dir": { UPLOAD_DIR, uploadedFilePath },
      "@/lib/file-signature": { contentMatchesType, EXTENSION_BY_MIME },
    });
    const redirect = new Error("NEXT_REDIRECT");
    const { upsertGalleryItemAction } = loadModule<typeof import("../src/app/admin/(dashboard)/thu-vien-trang-chu/actions")>(
      "src/app/admin/(dashboard)/thu-vien-trang-chu/actions.ts", {
        "next/cache": { revalidatePath: () => {} },
        "next/navigation": { redirect: () => { throw redirect; } },
        "@/lib/admin-auth": { requirePermission: async () => {} },
        "@/lib/db": { db, schema },
        "@/lib/utils": { normalizeExternalUrl, videoSource },
        "@/lib/media": media,
        "@/lib/safe-href": { safeHref },
        "@/lib/translate": { autoFillTranslations: async (pairs: { en: string }[]) => pairs.map((pair) => pair.en) },
        "@/lib/upload-rules": { checkUpload },
      }, { console: { error: () => {} } },
    );
    const form = new FormData();
    form.set("caption", "Buộc lỗi ghi");
    form.set("image", new File([Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)], "cover.png", { type: "image/png" }));
    form.set("videoFile", new File([Uint8Array.of(0x1a, 0x45, 0xdf, 0xa3)], "clip.webm", { type: "video/webm" }));

    assert.equal((await upsertGalleryItemAction(form)).message, "Chưa lưu được mục trải nghiệm. Vui lòng thử lại sau ít phút.");
    assert.equal(files.size, 0);
    assert.equal((await db.select().from(schema.mediaItems)).length, 0);
    assert.equal((await db.select().from(schema.galleryItems)).length, 0);

    form.set("caption", "Mục trải nghiệm thử");
    await assert.rejects(upsertGalleryItemAction(form), (error) => error === redirect);
    const [item] = await db.select().from(schema.galleryItems);
    assert.match(item.imageUrl, /\.png$/);
    assert.match(item.videoUrl ?? "", /\.webm$/);
    assert.equal(files.size, 2);
    assert.equal((await db.select().from(schema.mediaItems)).length, 2);
  } finally {
    await pg.close();
  }
});

test("ảnh chọn từ thư viện chặn query, mã hoá đường dẫn và traversal, giữ fallback", async () => {
  const { media } = mediaFixture();
  assert.equal(media.isLibraryImageUrl("/uploads/anh-1.WEBP"), true);
  const form = new FormData();
  for (const url of ["https://outside.test/a.png", "/uploads/a.png?x=1", "/uploads/a.png#x", "/uploads/../a.png", "/uploads/a%3F.png", "/uploads/a b.png", "/uploads/a\\b.png"]) {
    assert.equal(media.isLibraryImageUrl(url), false, url);
    form.set("picked", url);
    assert.equal(await media.resolveImageUrl(form, "file", "picked", "/uploads/old.png"), "/uploads/old.png");
  }
  form.set("picked", "/uploads/new.png");
  assert.equal(await media.resolveImageUrl(form, "file", "picked"), "/uploads/new.png");
});

test("upload cùng tên và cùng thời điểm không ghi đè; ghi tệp độc quyền", async () => {
  const { media, writes } = mediaFixture();
  const file = new File(["fixture"], "same.png", { type: "image/png" });
  const results = await Promise.all([media.saveUploadedFile(file), media.saveUploadedFile(file)]);
  assert.notEqual(results[0].url, results[1].url);
  assert.equal(writes.length, 2);
  assert.ok(writes.every(w => w.options.flag === "wx"));
});

test("đường dẫn xoá media không thể thoát uploads", () => {
  assert.equal(uploadedFilePath("/uploads/a.pdf"), path.join(UPLOAD_DIR, "a.pdf"));
  for (const url of ["/uploads/../secret.key", "/other/a.png", "/uploads/a/b.png", "/uploads/%2e%2e.png", "/uploads/a.png?x", "/uploads/a\\b.png"]) {
    assert.equal(uploadedFilePath(url), null, url);
  }
});

test("seed có cờ production/mật khẩu riêng không được quay về chế độ demo", () => {
  for (const env of [{}, { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }, { NEXT_PUBLIC_SITE_URL: "hopluc.edu.vn" }]) {
    assert.equal(isProductionSeed(env, ["--allow-production"]), true);
    assert.equal(isProductionSeed({ ...env, SEED_ADMIN_PASSWORD: "fixture-password-only" }, []), true);
  }
  assert.equal(isProductionSeed({}, []), false);
});

test("production từ chối mật khẩu demo trước khi cấp cookie", async () => {
  let cookiesWritten = 0;
  const action = loadModule<typeof import("../src/lib/actions/auth-actions")>("src/lib/actions/auth-actions.ts", {
    "next/headers": { headers: async () => new Headers(), cookies: async () => ({ set: () => { cookiesWritten++; }, delete: () => {} }) },
    "next/navigation": { redirect: () => { throw new Error("redirect"); } },
    "@/lib/db": { db: { query: { adminUsers: { findFirst: async () => ({ id: "fixture", passwordHash: "fixture" }) } } }, schema: { adminUsers: { email: "email" } } },
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/auth": { verifyPassword: async () => true, signSession: () => "fixture", credentialVersion: () => "v1" },
    "@/lib/rate-limit": { getClientIp: () => "unknown", isRateLimited: () => false, resetRateLimit: () => {} },
    "@/lib/demo-credentials": { DEMO_ADMIN_PASSWORD },
  }, { Headers });
  const form = new FormData();
  form.set("email", "fixture@example.test"); form.set("password", DEMO_ADMIN_PASSWORD);
  assert.ok((await action.loginAction({}, form)).error);
  assert.equal(cookiesWritten, 0);
  form.set("password", "fixture-strong-password");
  await assert.rejects(action.loginAction({}, form), /redirect/);
  assert.equal(cookiesWritten, 1);
});

test("cài đặt kiểm tra tất cả các ô trước khi ghi và bảo vệ email nhận hồ sơ", async () => {
  for (const allowed of [false, true]) {
    const updates: Record<string, unknown>[] = [];
    const action = loadModule<typeof import("../src/app/admin/(dashboard)/cai-dat/actions")>("src/app/admin/(dashboard)/cai-dat/actions.ts", {
      "next/cache": { revalidatePath: () => {} }, "next/navigation": { redirect: () => { throw new Error("redirect"); } },
      "drizzle-orm": { eq: () => ({}) },
      "@/lib/db": { db: {
        query: { siteSettings: { findFirst: async () => ({ email: "owner@example.test" }) } },
        update: () => ({ set: (values: Record<string, unknown>) => {
          updates.push(values);
          return { where: () => ({ returning: async () => [{ id: "main" }] }) };
        } }),
      }, schema: { siteSettings: { id: "main" } } },
      "@/lib/admin-auth": { requirePermission: async () => ({}) },
      "@/lib/admin-permissions": { hasPermission: () => allowed },
      "@/lib/validate": { isValidEmail: (s: string) => s.includes("@"), normalizeVnPhone: (s: string) => s.replace(/\./g, "") },
      "@/lib/translate": { autoFillTranslations: async () => [""] },
      "@/lib/utils": { normalizeExternalUrl: () => null, normalizeZaloUrl: () => null },
      "@/lib/safe-href": { safeHref },
    });
    const form = new FormData();
    form.set("hotline", "0900.000.000");
    form.set("announcement", "Thông báo thử");
    form.set("address", "   ");
    form.set("lmsUrl", "link sai");
    form.set("email", allowed ? "invalid-email" : "outside@example.test");
    const rejected = await action.updateSiteSettingsAction(form);
    assert.deepEqual(Object.keys(rejected.fields ?? {}).sort(), ["address", "email", "lmsUrl"]);
    assert.equal(updates.length, 0);

    form.set("address", "Địa chỉ thử");
    form.set("lmsUrl", "");
    if (allowed) form.set("email", "outside@example.test");
    else form.delete("email");
    await assert.rejects(action.updateSiteSettingsAction(form), /redirect/);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].address, "Địa chỉ thử");
    assert.equal(updates[0].lmsUrl, "#");
    assert.equal(updates[0].email, allowed ? "outside@example.test" : undefined);
  }
});

test("rate limit dọn cả khoá hết hạn khi có dưới 5000 khoá", () => {
  let now = 1000;
  const deleted: string[] = [];
  class FixtureMap extends Map {
    override delete(key: string) { deleted.push(key); return super.delete(key); }
  }
  const rate = loadModule<typeof import("../src/lib/rate-limit")>("src/lib/rate-limit.ts", {}, {
    Map: FixtureMap, Date: { now: () => now },
  });
  rate.checkRateLimit("expired", 1, 100);
  now = 1100;
  rate.checkRateLimit("new", 1, 100);
  assert.ok(deleted.includes("expired"));
});

test("production không ký phiên bằng secret ngắn hoặc secret mẫu", () => {
  const session = { userId: "fixture", email: "fixture@example.test", name: "Fixture" };
  for (const secret of ["short", "doi-chuoi-nay-thanh-ngau-nhien-that-dai-khi-deploy"]) {
    const auth = loadModule<typeof import("../src/lib/auth")>("src/lib/auth.ts", {}, {
      process: { env: { NODE_ENV: "production", SESSION_SECRET: secret } },
    });
    assert.throws(() => auth.signSession(session), /SESSION_SECRET/);
  }
});

test("gọi trực tiếp action với trạng thái lạ không được ghi DB", async () => {
  let updates = 0;
  const mocks = {
    "next/cache": { revalidatePath: () => {} },
    "drizzle-orm": { eq: () => ({}), and: () => ({}) },
    "@/lib/admin-auth": { requirePermission: async () => ({}) },
    "@/lib/db": { db: { update: () => { updates++; return { set: () => ({ where: async () => {} }) }; } }, schema: { admissionSubmissions: { id: "id" }, contactMessages: { id: "id" } } },
  };
  const admissions = loadModule<typeof import("../src/app/admin/(dashboard)/tuyen-sinh/actions")>("src/app/admin/(dashboard)/tuyen-sinh/actions.ts", mocks);
  const contacts = loadModule<typeof import("../src/app/admin/(dashboard)/lien-he/actions")>(
    "src/app/admin/(dashboard)/lien-he/actions.ts", { ...mocks, "./status": contactStatus },
  );
  await admissions.updateAdmissionStatusAction("fixture", "invalid" as "new");
  await contacts.markContactMessageAction("fixture", "invalid" as "new", "new");
  assert.equal(updates, 0);
  await admissions.updateAdmissionStatusAction("fixture", "contacted");
  await contacts.markContactMessageAction("fixture", "read", "new");
  assert.equal(updates, 2);
});

test("tin đã phản hồi rời bộ lọc chờ, giữ trạng thái khi thao tác từ trang cũ và có nhãn đúng trong CSV", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    await db.insert(schema.contactMessages).values([
      { id: "target", name: "QA tin thử", message: "Tin nhắn mẫu", status: "read" },
      { id: "unread", name: "QA tin mới", message: "Tin nhắn chưa xem" },
      { id: "waiting", name: "QA tin còn chờ", message: "Tin nhắn đã xem", status: "read" },
    ]);
    const mocks = {
      "@/lib/db": { db, schema },
      "@/lib/admin-auth": { requirePermission: async (permission: string) => assert.equal(permission, "admissions-contact") },
    };
    const { markContactMessageAction } = loadModule<typeof import("../src/app/admin/(dashboard)/lien-he/actions")>(
      "src/app/admin/(dashboard)/lien-he/actions.ts", {
        ...mocks, "next/cache": { revalidatePath: () => {} }, "./status": contactStatus,
      },
    );
    const { GET } = loadModule<typeof import("../src/app/admin/(dashboard)/lien-he/xuat-csv/route")>(
      "src/app/admin/(dashboard)/lien-he/xuat-csv/route.ts", {
        ...mocks, "@/lib/csv": csv, "@/lib/utils": { formatDbDateTime, vnDateKey },
        "../filter": { filterContactMessages, parseContactFilters }, "../status": contactStatus,
      }, { URL },
    );
    await markContactMessageAction("target", "replied", "read");
    await markContactMessageAction("target", "new", "read");
    const rows = await db.select().from(schema.contactMessages);
    assert.equal(rows.find((row) => row.id === "target")?.status, "replied");
    assert.deepEqual(filterContactMessages(rows, parseContactFilters({ status: "read" })).map((row) => row.id), ["waiting"]);
    const response = await GET(new Request("http://localhost/admin/lien-he/xuat-csv?status=replied&q=QA"));
    const body = await response.text();
    assert.match(body, /QA tin thử.*Đã phản hồi/);
    assert.doesNotMatch(body, /QA tin mới|QA tin còn chờ/);
    await markContactMessageAction("target", "read", "replied");
    const reopened = await db.select().from(schema.contactMessages);
    assert.equal(reopened.find((row) => row.id === "target")?.status, "read");
  } finally {
    await pg.close();
  }
});

test("href chỉ nhận giao thức cho phép và không nhận URL lách bằng ký tự điều khiển", () => {
  for (const href of ["/tuyen-sinh?nganh=duoc#dang-ky", "#moc", "https://example.test/path", "mailto:a@example.test", "tel:+84901234567", "sms:0901234567"]) {
    assert.ok(safeHref(href), href);
  }
  for (const href of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)", "data:text/html,x", "//outside.test", "/\\outside.test", "https://user:password@example.test", "vbscript:x"]) {
    assert.equal(safeHref(href), null, href);
  }
});

test("xoá cache ảnh chỉ đụng cache dựng lại được; từ chối parent symlink", async () => {
  let symlink = false;
  const removed: string[] = [];
  const cache = loadModule<typeof import("../src/lib/image-cache")>("src/lib/image-cache.ts", {
    "node:fs/promises": {
      lstat: async () => ({ isDirectory: () => true, isSymbolicLink: () => symlink }),
      rm: async (target: string) => { removed.push(target); },
    },
  }, { process: { cwd: () => "/fixture/project" } });
  await cache.purgeOptimizedImageCache();
  assert.equal(removed.length, 1);
  assert.equal(removed[0], path.resolve("/fixture/project", ".next/cache/images"));
  symlink = true;
  await assert.rejects(cache.purgeOptimizedImageCache(), /cache/);
  assert.equal(removed.length, 1);
});

test("xoá media dọn cache trước khi xoá metadata; không đụng DB/tệp thật", async () => {
  const effects: string[] = [];
  const action = loadModule<typeof import("../src/app/admin/(dashboard)/media/actions")>("src/app/admin/(dashboard)/media/actions.ts", {
    "next/cache": { revalidatePath: () => {} }, "next/navigation": { redirect: () => {} },
    "node:fs/promises": { unlink: async () => { effects.push("unlink"); } },
    "@/lib/upload-dir": { uploadedFilePath: () => "/fixture/uploads/a.png" },
    "@/lib/image-cache": { purgeOptimizedImageCache: async () => { effects.push("purge"); } },
    "@/lib/media": {}, "@/lib/admin-auth": { requirePermission: async () => ({}) },
    "@/lib/media-usage": { getMediaUsage: async () => new Map() },
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/db": { db: { query: { mediaItems: { findFirst: async () => ({ url: "/uploads/a.png" }) } }, delete: () => ({ where: async () => { effects.push("metadata"); } }) }, schema: { mediaItems: { id: "id" } } },
  });
  await action.deleteMediaAction("fixture");
  assert.deepEqual(effects, ["unlink", "purge", "metadata"]);
});

test("gọi trực tiếp action không thể xoá media đang dùng", async () => {
  const effects: string[] = [];
  const action = loadModule<typeof import("../src/app/admin/(dashboard)/media/actions")>("src/app/admin/(dashboard)/media/actions.ts", {
    "next/cache": { revalidatePath: () => {} },
    "next/navigation": { redirect: () => { throw new Error("blocked"); } },
    "node:fs/promises": { unlink: async () => { effects.push("unlink"); } },
    "@/lib/upload-dir": { uploadedFilePath: () => "/fixture/uploads/a.png" },
    "@/lib/image-cache": { purgeOptimizedImageCache: async () => { effects.push("purge"); } },
    "@/lib/media": {}, "@/lib/admin-auth": { requirePermission: async () => ({}) },
    "@/lib/media-usage": { getMediaUsage: async () => new Map([["/uploads/a.png", [{ label: "Banner", href: "/admin/banner-trang-chu" }]]]) },
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/db": { db: { query: { mediaItems: { findFirst: async () => ({ url: "/uploads/a.png" }) } }, delete: () => ({ where: async () => { effects.push("metadata"); } }) }, schema: { mediaItems: { id: "id" } } },
  });
  await assert.rejects(action.deleteMediaAction("fixture"), /blocked/);
  assert.deepEqual(effects, []);
});

test("upload HEAD không gắn cache immutable một năm", async () => {
  const route = loadModule<typeof import("../src/app/uploads/[...path]/route")>("src/app/uploads/[...path]/route.ts", {
    "node:fs/promises": { stat: async () => ({ isFile: () => true, size: 1, mtime: new Date(0) }) },
    "@/lib/upload-dir": { UPLOAD_DIR: path.resolve("/fixture/uploads") },
    "@/lib/http-range": { parseRange: () => null },
  }, { Headers, Response });
  const response = await route.HEAD(new Request("http://fixture.test/uploads/a.png"), { params: Promise.resolve({ path: ["a.png"] }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=60, must-revalidate");
});

test("khoá email do IP khác gây ra không chặn người có mật khẩu đúng", async () => {
  const action = loadModule<typeof import("../src/lib/actions/auth-actions")>("src/lib/actions/auth-actions.ts", {
    "next/headers": { headers: async () => new Headers(), cookies: async () => ({ set: () => {}, delete: () => {} }) },
    "next/navigation": { redirect: () => { throw new Error("logged-in"); } },
    "@/lib/db": { db: { query: { adminUsers: { findFirst: async () => ({ id: "fixture", passwordHash: "fixture" }) } } }, schema: { adminUsers: { email: "email" } } },
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/auth": { verifyPassword: async () => true, signSession: () => "fixture", credentialVersion: () => "v1" },
    "@/lib/rate-limit": { getClientIp: () => "198.51.100.2", isRateLimited: (key: string) => key.startsWith("login-email:") && !key.includes("198.51.100.2:"), resetRateLimit: () => {} },
    "@/lib/demo-credentials": { DEMO_ADMIN_PASSWORD },
  }, { Headers });
  const form = new FormData(); form.set("email", "fixture@example.test"); form.set("password", "fixture-password-only");
  await assert.rejects(action.loginAction({}, form), /logged-in/);
});

test("token reset của email cũ không đổi được mật khẩu sau khi email đã thay", async () => {
  let updated = false;
  const action = loadModule<typeof import("../src/lib/actions/password-reset-actions")>("src/lib/actions/password-reset-actions.ts", {
    "next/headers": {}, "next/navigation": {}, "drizzle-orm": { eq: () => ({}) },
    "@/lib/db": { db: { query: { adminUsers: { findFirst: async () => ({ email: "new@example.test", passwordHash: "fixture" }) } }, update: () => { updated = true; } }, schema: { adminUsers: { id: "id" } } },
    "@/lib/auth": { verifyResetToken: () => ({ userId: "fixture", email: "old@example.test" }), isCredentialCurrent: () => true },
    "@/lib/email": {}, "@/lib/rate-limit": {}, "@/lib/demo-credentials": { DEMO_ADMIN_PASSWORD }, "@/lib/constants": {},
  });
  const form = new FormData(); form.set("token", "fixture"); form.set("password", "fixture-password-only"); form.set("confirmPassword", "fixture-password-only");
  assert.ok((await action.resetPasswordAction({}, form)).error);
  assert.equal(updated, false);
});

test("yêu cầu reset xếp email sau phản hồi thay vì chờ dịch vụ gửi", async () => {
  let queued = 0;
  const action = loadModule<typeof import("../src/lib/actions/password-reset-actions")>("src/lib/actions/password-reset-actions.ts", {
    "next/headers": { headers: async () => new Headers() }, "next/navigation": {}, "drizzle-orm": { eq: () => ({}) },
    "@/lib/db": { db: { query: { adminUsers: { findFirst: async () => ({ id: "fixture", email: "fixture@example.test", name: "Fixture", passwordHash: "fixture" }) } } }, schema: { adminUsers: { email: "email" } } },
    "@/lib/auth": { signResetToken: () => "fixture-token" },
    "@/lib/email": { sendEmailAfterResponse: () => { queued++; }, escapeHtml: (s: string) => s },
    "@/lib/rate-limit": { getClientIp: () => "unknown", checkRateLimit: () => true },
    "@/lib/demo-credentials": { DEMO_ADMIN_PASSWORD }, "@/lib/constants": { SITE_URL: "https://fixture.test", SITE: { name: "Fixture" } },
  }, { Headers });
  const form = new FormData(); form.set("email", "fixture@example.test");
  assert.ok((await action.requestPasswordResetAction({}, form)).message);
  assert.equal(queued, 1);
});

test("hạn mức ký tự tính chi phí thực, không chỉ đếm số lần gọi", () => {
  assert.equal(checkRateLimit("fixture-characters", 10, 60000, 6), true);
  assert.equal(checkRateLimit("fixture-characters", 10, 60000, 5), false);
  assert.equal(checkRateLimit("fixture-characters", 10, 60000, 4), true);
  assert.equal(checkRateLimit("fixture-characters", 10, 60000, -1), false);
});

test("dịch lúc lưu và dịch chủ động dùng cùng quota; hết quota vẫn lưu được bản tiếng Việt", async () => {
  let remaining = 50000, requests = 0;
  const translation = loadModule<typeof import("../src/lib/translate")>("src/lib/translate.ts", {
    "@/lib/rate-limit": { checkRateLimit: (_key: string, _limit: number, _window: number, cost: number) => { if (cost > remaining) return false; remaining -= cost; return true; } },
    "@/lib/admin-permissions": { canTranslate: () => true },
    "@/lib/admin-auth": { getCurrentAdminUser: async () => ({ id: "fixture" }) },
  }, {
    process: { env: { DEEPL_API_KEY: "fixture-only-key" } }, URLSearchParams, AbortSignal,
    fetch: async () => { requests++; return Response.json({ translations: [{ text: "Fixture translation" }] }); },
  });
  const text = "a".repeat(20000);
  assert.equal((await translation.translateTexts([text]))[0], "Fixture translation");
  assert.equal((await translation.autoFillTranslations([{ vi: text, en: "" }]))[0], "Fixture translation");
  assert.equal((await translation.autoFillTranslations([{ vi: text, en: "" }]))[0], "");
  await assert.rejects(translation.translateTexts([text]), /50.000/);
  assert.equal(requests, 2);
});

test("đăng xuất xoá cookie __Host với Secure, Path=/ và thời hạn hết hạn", async () => {
  let options: Record<string, unknown> = {};
  const action = loadModule<typeof import("../src/lib/actions/auth-actions")>("src/lib/actions/auth-actions.ts", {
    "next/headers": { cookies: async () => ({ set: (_name: string, _value: string, settings: Record<string, unknown>) => { options = settings; } }) },
    "next/navigation": { redirect: () => { throw new Error("logged-out"); } },
    "@/lib/db": {}, "drizzle-orm": {}, "@/lib/auth": { SESSION_COOKIE_NAME: "__Host-hopluc_admin_session" },
    "@/lib/rate-limit": {}, "@/lib/demo-credentials": {},
  });
  await assert.rejects(action.logoutAction(), /logged-out/);
  assert.equal(options.secure, true);
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, 0);
});
