import test from "node:test";
import assert from "node:assert/strict";
import { contentMatchesType, EXTENSION_BY_MIME } from "../src/lib/file-signature";
import { ALLOWED_UPLOAD_TYPES } from "../src/lib/upload-rules";
import { looksLikeProduction } from "../src/lib/db/script-guard";
import { productionConfigProblems } from "../src/lib/prod-config";

const bytes = (...parts: (number[] | string)[]) =>
  Uint8Array.from(parts.flatMap((p) => (typeof p === "string" ? Array.from(p, (c) => c.charCodeAt(0)) : p)));

test("mọi loại file cho phép tải lên đều có đuôi chuẩn và cách kiểm tra nội dung", () => {
  for (const mime of Object.values(ALLOWED_UPLOAD_TYPES).flat()) {
    assert.ok(EXTENSION_BY_MIME[mime], `thiếu đuôi cho ${mime}`);
    assert.equal(contentMatchesType(mime, new Uint8Array(0)), false, `${mime} không được nhận file rỗng`);
  }
});

test("nhận diện đúng chữ ký file thật", () => {
  assert.ok(contentMatchesType("image/jpeg", bytes([0xff, 0xd8, 0xff, 0xe0])));
  assert.ok(contentMatchesType("image/png", bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])));
  assert.ok(contentMatchesType("image/gif", bytes("GIF89a")));
  assert.ok(contentMatchesType("image/webp", bytes("RIFF", [1, 2, 3, 4], "WEBPVP8 ")));
  assert.ok(contentMatchesType("video/mp4", bytes([0, 0, 0, 0x20], "ftypisom")));
  assert.ok(contentMatchesType("video/webm", bytes([0x1a, 0x45, 0xdf, 0xa3])));
  assert.ok(contentMatchesType("application/pdf", bytes("%PDF-1.7")));
  assert.ok(contentMatchesType("application/pdf", bytes([0xef, 0xbb, 0xbf], "%PDF-1.4")));
  assert.ok(contentMatchesType("application/msword", bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])));
  assert.ok(contentMatchesType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes("PK", [3, 4])));
});

test("chặn file giả dạng: trang HTML khai là ảnh, ảnh PNG khai là JPEG, loại lạ", () => {
  const html = bytes("<!doctype html><script>alert(1)</script>");
  assert.equal(contentMatchesType("image/png", html), false);
  assert.equal(contentMatchesType("image/jpeg", html), false);
  assert.equal(contentMatchesType("application/pdf", html), false);
  assert.equal(contentMatchesType("image/jpeg", bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])), false);
  assert.equal(contentMatchesType("text/html", html), false);
  assert.equal(contentMatchesType("image/svg+xml", bytes("<svg")), false);
});

test("script dev nhận ra môi trường thật qua NODE_ENV hoặc tên miền", () => {
  assert.equal(looksLikeProduction({ NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }), false);
  assert.equal(looksLikeProduction({ NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100" }), false);
  assert.equal(looksLikeProduction({ NEXT_PUBLIC_SITE_URL: "http://hopluc.test" }), false);
  assert.equal(looksLikeProduction({}), false);
  assert.equal(looksLikeProduction({ NODE_ENV: "production" }), true);
  assert.equal(looksLikeProduction({ NEXT_PUBLIC_SITE_URL: "https://hopluc.edu.vn" }), true);
});

test("cảnh báo cấu hình production", () => {
  const good = {
    TRUST_PROXY_HOPS: "1",
    NEXT_PUBLIC_SITE_URL: "https://hopluc.edu.vn",
    SESSION_SECRET: "x".repeat(64),
    DATABASE_URL: "postgres://u:p@localhost:5432/hopluc",
  };
  assert.deepEqual(productionConfigProblems(good), []);
  const problems = productionConfigProblems({ ...good, TRUST_PROXY_HOPS: undefined, NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /TRUST_PROXY_HOPS=0/);
  assert.match(problems[1], /NEXT_PUBLIC_SITE_URL/);
  assert.equal(productionConfigProblems({ ...good, TRUST_PROXY_HOPS: "abc" }).length, 1);
  assert.equal(productionConfigProblems({ ...good, SESSION_SECRET: "ngan" }).length, 1);
  assert.equal(productionConfigProblems({ ...good, NEXT_PUBLIC_SITE_URL: "http://hopluc.edu.vn" }).length, 1);
});
