import test from "node:test";
import assert from "node:assert/strict";
import { getClientIp, checkRateLimit, isRateLimited, resetRateLimit } from "../src/lib/rate-limit";

test("checking authentication limits consumes no attempts; failures block and success resets", () => {
  const key = "login-test-failures";
  for (let i = 0; i < 10; i++) assert.equal(isRateLimited(key, 5), false);
  for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60000);
  assert.equal(isRateLimited(key, 5), true);
  resetRateLimit(key);
  assert.equal(isRateLimited(key, 5), false);
});

const request = (chain: string) => ({ headers: new Headers({ "x-forwarded-for": chain, "x-real-ip": "1.2.3.4" }) });

test("mặc định không tin header do người gọi tự gửi", () => {
  delete process.env.TRUST_PROXY_HOPS;
  assert.equal(getClientIp(request("1.2.3.4")), "unknown");
});

test("không lấy IP giả bên trái nếu proxy append IP thật", () => {
  process.env.TRUST_PROXY_HOPS = "1";
  assert.equal(getClientIp(request("1.2.3.4, 198.51.100.2")), "198.51.100.2");
  assert.equal(getClientIp(request("9.8.7.6, 198.51.100.2")), "198.51.100.2");
  assert.equal(getClientIp(request("not-an-ip")), "unknown");
});

test("số hop phải khớp chuỗi proxy tin cậy", () => {
  process.env.TRUST_PROXY_HOPS = "2";
  assert.equal(getClientIp(request("198.51.100.2, 10.0.0.1")), "198.51.100.2");
  assert.equal(getClientIp(request("198.51.100.2")), "unknown");
  for (const invalid of ["-1", "NaN", "1.5", "17"]) {
    process.env.TRUST_PROXY_HOPS = invalid;
    assert.equal(getClientIp(request("198.51.100.2")), "unknown");
  }
});

test("bucket chặn vượt giới hạn và mở lại khi hết cửa sổ", (context) => {
  let now = 1000;
  context.mock.method(Date, "now", () => now);
  assert.equal(checkRateLimit("test-window", 2, 1000), true);
  assert.equal(checkRateLimit("test-window", 2, 1000), true);
  assert.equal(checkRateLimit("test-window", 2, 1000), false);
  now = 2001;
  assert.equal(checkRateLimit("test-window", 2, 1000), true);
});
