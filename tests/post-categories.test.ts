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

// Chạy các hàm truy vấn thật với Postgres trong bộ nhớ và cookie ngôn ngữ thử nghiệm.
function loadModule<T>(file: string, mocks: Record<string, unknown>): T {
  const filename = path.resolve(file);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const moduleResult = { exports: {} };
  const actualRequire = createRequire(filename);
  vm.runInNewContext(output, {
    module: moduleResult, exports: moduleResult.exports,
    require: (id: string) => Object.hasOwn(mocks, id) ? mocks[id] : actualRequire(id),
  }, { filename, timeout: 5000 });
  return moduleResult.exports as T;
}

test("danh mục dùng đúng VI/EN ở Trang chủ, tin ghim, danh sách, bộ lọc và chi tiết", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    await db.insert(schema.categories).values([
      { id: "events", slug: "su-kien", name: "Sự kiện", nameEn: "Events" },
      { id: "fallback", slug: "chua-dich", name: "Chưa dịch", nameEn: null },
    ]);
    await db.insert(schema.posts).values([
      { slug: "graduation", title: "Lễ tốt nghiệp", titleEn: "Graduation", content: "Nội dung", categoryId: "events", status: "published", isPinned: 1, publishedAt: "2026-10-02T00:00:00Z" },
      { slug: "fallback", title: "Bài chưa dịch", content: "Nội dung", categoryId: "fallback", status: "published", isPinned: 1, publishedAt: "2026-10-01T00:00:00Z" },
      { slug: "uncategorized", title: "Không danh mục", content: "Nội dung", status: "published", publishedAt: "2026-09-30T00:00:00Z" },
      { slug: "draft", title: "Bản nháp", content: "Nội dung", categoryId: "events", status: "draft" },
    ]);
    let language = "en";
    const locale = loadModule<typeof import("../src/lib/locale")>("src/lib/locale.ts", {
      "next/headers": { cookies: async () => ({ get: () => ({ value: language }) }) },
    });
    const posts = loadModule<typeof import("../src/lib/data/posts")>("src/lib/data/posts.ts", {
      "@/lib/db": { db, schema }, "@/lib/locale": locale,
    });

    // Chuyển EN → VI → EN trong cùng module để bắt cả trường hợp giữ nhầm bản dịch cũ.
    for (const lang of ["en", "vi", "en"]) {
      language = lang;
      const expectedCategory = lang === "en" ? "Events" : "Sự kiện";
      const lists = [
        await posts.getLatestPublishedPosts(10),
        await posts.getPinnedPosts(10),
        await posts.getAllPublishedPosts(),
        await posts.getAllPublishedPosts("su-kien"),
        (await posts.getPublishedPostsPage(undefined, 1)).posts,
        (await posts.getPublishedPostsPage("su-kien", 1)).posts,
      ];
      for (const list of lists) {
        assert.equal(list.find((p) => p.slug === "graduation")?.categoryName, expectedCategory);
        assert.ok(!list.some((p) => p.slug === "draft"));
        const untranslated = list.find((p) => p.slug === "fallback");
        if (untranslated) assert.equal(untranslated.categoryName, "Chưa dịch");
        const uncategorized = list.find((p) => p.slug === "uncategorized");
        if (uncategorized) assert.equal(uncategorized.categoryName, null);
      }
      assert.equal((await posts.getPublishedPostBySlug("graduation"))?.categoryName, expectedCategory);
      assert.equal((await posts.getPublishedPostBySlug("fallback"))?.categoryName, "Chưa dịch");
      assert.equal(await posts.getPublishedPostBySlug("draft"), null);
    }
  } finally {
    await pg.close();
  }
});
