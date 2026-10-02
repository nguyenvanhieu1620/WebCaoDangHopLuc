import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidCccd,
  isValidEmail,
  isValidVnPhone,
  normalizeCccd,
  normalizeVnPhone,
  readJsonObject,
  readStringFields,
} from "../src/lib/validate";

function jsonRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

/** Body dạng stream, không có Content-Length — mô phỏng client gửi chunked để né kiểm tra header. */
function streamRequest(chunks: string[]): Request {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Request("http://localhost/api/test", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

test("readJsonObject: object hợp lệ", async () => {
  const result = await readJsonObject(jsonRequest('{"fullName":"Nguyễn Văn A"}'), 1024);
  assert.deepEqual(result, { ok: true, data: { fullName: "Nguyễn Văn A" } });
});

test("readJsonObject: JSON hỏng/rỗng trả 400 tiếng Việt", async () => {
  for (const body of ["{", "not json", "", "{'a':1}"]) {
    const result = await readJsonObject(jsonRequest(body), 1024);
    assert.equal(result.ok, false, `body ${JSON.stringify(body)}`);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /JSON/);
    }
  }
});

test("readJsonObject: null/mảng/số/chuỗi/boolean không phải object trả 400", async () => {
  for (const body of ["null", "[]", '[{"a":1}]', "42", '"abc"', "true"]) {
    const result = await readJsonObject(jsonRequest(body), 1024);
    assert.equal(result.ok, false, `body ${body}`);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.equal(result.error, "Dữ liệu gửi lên không hợp lệ.");
    }
  }
});

test("readJsonObject: Content-Length vượt giới hạn trả 413", async () => {
  const body = JSON.stringify({ note: "x".repeat(2000) });
  const result = await readJsonObject(jsonRequest(body, { "Content-Length": String(body.length) }), 1024);
  assert.deepEqual(result, { ok: false, status: 413, error: "Dữ liệu gửi lên quá lớn." });
});

test("readJsonObject: body stream không Content-Length vẫn bị chặn 413 theo byte thật", async () => {
  const result = await readJsonObject(streamRequest(['{"note":"', "x".repeat(600), "x".repeat(600), '"}']), 1024);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
});

test("readJsonObject: giới hạn tính theo byte UTF-8, không theo ký tự", async () => {
  // "ệ" là 3 byte UTF-8: 400 ký tự ≈ 1200 byte > 1024 dù chỉ 400 ký tự.
  const body = JSON.stringify({ note: "ệ".repeat(400) });
  const tooBig = await readJsonObject(streamRequest([body]), 1024);
  assert.equal(tooBig.ok, false);
  const fits = await readJsonObject(streamRequest([body]), 2048);
  assert.equal(fits.ok, true);
});

test("readStringFields: trim, lowercase, optional rỗng/thiếu thành chuỗi rỗng", () => {
  const result = readStringFields(
    { name: "  Nguyễn Văn A  ", email: "  Ban@Email.COM ", note: "   " },
    {
      name: { label: "họ tên", max: 200, required: true },
      email: { label: "email", max: 254, lowercase: true },
      note: { label: "ghi chú", max: 3000 },
      phone: { label: "số điện thoại", max: 30 },
    }
  );
  assert.deepEqual(result, {
    ok: true,
    values: { name: "Nguyễn Văn A", email: "ban@email.com", note: "", phone: "" },
  });
});

test("readStringFields: null/số/mảng/object thay chuỗi là lỗi kiểu", () => {
  for (const bad of [null, 123, true, [], ["a"], {}, { a: 1 }]) {
    const result = readStringFields({ name: bad }, { name: { label: "họ tên", max: 200 } });
    assert.equal(result.ok, false, `value ${JSON.stringify(bad)}`);
    if (!result.ok) {
      assert.equal(result.kind, "type");
      assert.equal(result.field, "name");
      assert.equal(result.error, 'Trường "họ tên" phải là chuỗi ký tự.');
    }
  }
});

test("readStringFields: thiếu field bắt buộc (kể cả chỉ có khoảng trắng)", () => {
  for (const body of [{}, { name: "" }, { name: "   " }]) {
    const result = readStringFields(body, { name: { label: "họ tên", max: 200, required: true } });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.kind, "missing");
  }
});

test("readStringFields: độ dài tính sau trim, vượt max là tooLong", () => {
  const rules = { note: { label: "ghi chú", max: 5 } };
  assert.equal(readStringFields({ note: "  12345  " }, rules).ok, true);
  const result = readStringFields({ note: "123456" }, rules);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "tooLong");
    assert.match(result.error, /tối đa 5 ký tự/);
  }
});

test("readStringFields: dừng ở field lỗi đầu tiên theo thứ tự rules", () => {
  const result = readStringFields(
    { a: 1, b: null },
    { a: { label: "A", max: 10 }, b: { label: "B", max: 10 } }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.field, "a");
});

test("isValidEmail", () => {
  assert.equal(isValidEmail("ban@email.com"), true);
  assert.equal(isValidEmail("a.b+c@truong.edu.vn"), true);
  for (const bad of ["", "ban", "ban@", "@email.com", "ban@email", "ban @email.com", "a@b@c.com"]) {
    assert.equal(isValidEmail(bad), false, bad);
  }
  assert.equal(isValidEmail(`${"a".repeat(250)}@b.vn`), false);
});

test("normalizeVnPhone + isValidVnPhone: 10 chữ số bắt đầu 0 hoặc +84", () => {
  assert.equal(normalizeVnPhone("090 123-4567"), "0901234567");
  assert.equal(normalizeVnPhone("(+84) 901.234.567"), "+84901234567");
  for (const ok of ["0901234567", "0387654321", "+84901234567"]) {
    assert.equal(isValidVnPhone(ok), true, ok);
  }
  for (const bad of [
    "",
    "090123456", // 9 số
    "09012345678", // 11 số
    "1901234567", // không bắt đầu bằng 0
    "0001234567", // sau 0 không được là 0
    "84901234567", // thiếu dấu +
    "+840901234567", // +84 kèm số 0
    "09012345ab",
  ]) {
    assert.equal(isValidVnPhone(bad), false, bad);
  }
});

test("normalizeCccd + isValidCccd: đúng 12 chữ số", () => {
  assert.equal(normalizeCccd(" 038 201 001 234 "), "038201001234");
  assert.equal(isValidCccd("038201001234"), true);
  for (const bad of ["", "03820100123", "0382010012345", "03820100123a", "038201-01234", "123456789"]) {
    assert.equal(isValidCccd(bad), false, bad);
  }
});
