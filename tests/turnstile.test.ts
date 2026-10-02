import test, { after } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstileToken } from "../src/lib/turnstile";

const previousSecret = process.env.TURNSTILE_SECRET_KEY;
after(() => {
  if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = previousSecret;
});

test("không gửi unknown IP; chỉ gửi IP hợp lệ và dùng timeout", async (context) => {
  process.env.TURNSTILE_SECRET_KEY = "test-only-secret";
  const sent: URLSearchParams[] = [];
  context.mock.method(globalThis, "fetch", async (_input: string | URL | Request, init?: RequestInit) => {
    assert.ok(init?.signal);
    sent.push(init.body as URLSearchParams);
    return Response.json({ success: true });
  });
  assert.equal(await verifyTurnstileToken("test-token", "unknown"), true);
  assert.equal(sent[0].has("remoteip"), false);
  assert.equal(await verifyTurnstileToken("test-token", "203.0.113.1"), true);
  assert.equal(sent[1].get("remoteip"), "203.0.113.1");
});

test("token trống/quá dài không gọi dịch vụ; lỗi mạng bị từ chối", async (context) => {
  process.env.TURNSTILE_SECRET_KEY = "test-only-secret";
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("network"); });
  assert.equal(await verifyTurnstileToken("", "unknown"), false);
  assert.equal(await verifyTurnstileToken("x".repeat(2049), "unknown"), false);
  assert.equal(calls, 0);
  assert.equal(await verifyTurnstileToken("test-token", "unknown"), false);
});

test("dịch vụ trả lỗi HTTP bị từ chối; chưa bật key giữ tương thích", async (context) => {
  process.env.TURNSTILE_SECRET_KEY = "test-only-secret";
  context.mock.method(globalThis, "fetch", async () => Response.json({ success: true }, { status: 500 }));
  assert.equal(await verifyTurnstileToken("test-token", "unknown"), false);
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal(await verifyTurnstileToken("", "unknown"), true);
});
