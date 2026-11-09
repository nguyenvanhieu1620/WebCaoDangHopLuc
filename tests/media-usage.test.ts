import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "../src/lib/db/client";
import * as schema from "../src/lib/db/schema";

test("media dùng trong bản nháp, bản Anh, video, tài liệu và Markdown đều được nhận diện", async () => {
  const pg = new PGlite();
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    globalThis.__testDb = db as unknown as Database;
    const { getMediaUsage, referencesMedia } = await import("../src/lib/media-usage");
    await db.insert(schema.posts).values({ slug: "draft", title: "Bản nháp", content: "50% ![Ảnh](/uploads/draft.png)", contentEn: "![Image](%2Fuploads%2Fenglish%2Epng)", attachmentUrl: "/uploads/document.pdf", status: "draft" });
    await db.insert(schema.heroBanners).values({ imageUrl: "/uploads/banner.png", videoUrl: "/uploads/movie.mp4" });
    await db.insert(schema.pages).values({ slug: "test", title: "Test", content: '<img src="/uploads/inline.png?v=1">' });
    await db.insert(schema.pages).values({ slug: "encoded", title: "Encoded", content: '%2F%75%70%6C%6F%61%64%73%2Fencoded.png' });
    const urls = ["draft.png", "english.png", "document.pdf", "banner.png", "movie.mp4", "inline.png", "encoded.png", "unused.png"].map((name) => `/uploads/${name}`);
    const usages = await getMediaUsage(urls);
    for (const url of urls.slice(0, -1)) assert.ok(usages.get(url)!.length > 0, url);
    assert.equal(usages.get("/uploads/unused.png")!.length, 0);
    assert.equal(referencesMedia("![x](/uploads/a.png2)", "/uploads/a.png"), false);
    assert.equal(referencesMedia("50% ![x](%2fuploads%2fa%2Epng)", "/uploads/a.png"), true);
    assert.equal(referencesMedia('https://example.com/uploads/a.png#caption', "/uploads/a.png"), true);
    assert.equal(referencesMedia('"\\/uploads\\/a.png"', "/uploads/a.png"), true);
    assert.equal(referencesMedia(null, "/uploads/a.png"), false);
  } finally {
    globalThis.__testDb = undefined;
    await pg.close();
  }
});
