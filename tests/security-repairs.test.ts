import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { isProductionSeed } from "../src/lib/db/script-guard";
import { uploadedFilePath, UPLOAD_DIR } from "../src/lib/upload-dir";
import { DEMO_ADMIN_PASSWORD } from "../src/lib/demo-credentials";
import { safeHref } from "../src/lib/safe-href";
import { checkRateLimit } from "../src/lib/rate-limit";

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

test("quyền cài đặt không được đổi email nhận hồ sơ; email sai cũng bị giữ lại", async () => {
  for (const allowed of [false, true]) {
    let stored: Record<string, unknown> = {};
    const action = loadModule<typeof import("../src/app/admin/(dashboard)/cai-dat/actions")>("src/app/admin/(dashboard)/cai-dat/actions.ts", {
      "next/cache": { revalidatePath: () => {} }, "next/navigation": { redirect: () => { throw new Error("redirect"); } },
      "drizzle-orm": { eq: () => ({}) },
      "@/lib/db": { db: { query: { siteSettings: { findFirst: async () => ({ email: "owner@example.test" }) } }, update: () => ({ set: (value: Record<string, unknown>) => { stored = value; return { where: async () => {} }; } }) }, schema: { siteSettings: { id: "main" } } },
      "@/lib/admin-auth": { requirePermission: async () => ({}) },
      "@/lib/admin-permissions": { hasPermission: () => allowed },
      "@/lib/validate": { isValidEmail: (s: string) => s.includes("@") },
      "@/lib/translate": { autoFillTranslations: async () => [""] },
      "@/lib/utils": { normalizeExternalUrl: () => null, normalizeZaloUrl: () => null },
    }, { URLSearchParams });
    const form = new FormData();
    for (const field of ["hotline", "address", "announcement"]) form.set(field, "fixture");
    form.set("email", allowed ? "invalid-email" : "outside@example.test");
    await assert.rejects(action.updateSiteSettingsAction(form), /redirect/);
    assert.equal(stored.email, undefined);
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
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/admin-auth": { requirePermission: async () => ({}) },
    "@/lib/db": { db: { update: () => { updates++; return { set: () => ({ where: async () => {} }) }; } }, schema: { admissionSubmissions: { id: "id" }, contactMessages: { id: "id" } } },
  };
  const admissions = loadModule<typeof import("../src/app/admin/(dashboard)/tuyen-sinh/actions")>("src/app/admin/(dashboard)/tuyen-sinh/actions.ts", mocks);
  const contacts = loadModule<typeof import("../src/app/admin/(dashboard)/lien-he/actions")>("src/app/admin/(dashboard)/lien-he/actions.ts", mocks);
  await admissions.updateAdmissionStatusAction("fixture", "invalid" as "new");
  await contacts.markContactMessageAction("fixture", "invalid" as "new");
  assert.equal(updates, 0);
  await admissions.updateAdmissionStatusAction("fixture", "contacted");
  await contacts.markContactMessageAction("fixture", "read");
  assert.equal(updates, 2);
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
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/db": { db: { query: { mediaItems: { findFirst: async () => ({ url: "/uploads/a.png" }) } }, delete: () => ({ where: async () => { effects.push("metadata"); } }) }, schema: { mediaItems: { id: "id" } } },
  });
  await action.deleteMediaAction("fixture");
  assert.deepEqual(effects, ["unlink", "purge", "metadata"]);
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
