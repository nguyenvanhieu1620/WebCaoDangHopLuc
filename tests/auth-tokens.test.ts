import test from "node:test";
import assert from "node:assert/strict";
import { credentialVersion, isCredentialCurrent, signResetToken, verifyResetToken, signSession, verifySession } from "../src/lib/auth";

process.env.SESSION_SECRET = "test-only-secret-for-auth-token-verification";

test("session chỉ có hiệu lực với phiên bản mật khẩu đang dùng", () => {
  const cookie = signSession({ userId: "test", email: "test@example.com", name: "Test", credentialVersion: credentialVersion("old-password-hash") });
  const session = verifySession(cookie);
  assert.ok(session);
  assert.equal(isCredentialCurrent(session, "old-password-hash"), true);
  assert.equal(isCredentialCurrent(session, "new-password-hash"), false);
  assert.equal(isCredentialCurrent({}, "old-password-hash"), false);
});

test("token reset mất hiệu lực sau khi mật khẩu đổi, không dùng làm session", () => {
  const token = signResetToken("test", "old-password-hash");
  const payload = verifyResetToken(token);
  assert.ok(payload);
  assert.equal(isCredentialCurrent(payload, "old-password-hash"), true);
  assert.equal(isCredentialCurrent(payload, "new-password-hash"), false);
  assert.equal(verifySession(token), null);
});

test("token bị sửa hoặc hết hạn phải bị từ chối", (context) => {
  const token = signResetToken("test", "hash");
  assert.equal(verifyResetToken(token + "modified"), null);
  const now = Date.now();
  context.mock.method(Date, "now", () => now + 31 * 60 * 1000);
  assert.equal(verifyResetToken(token), null);
});
