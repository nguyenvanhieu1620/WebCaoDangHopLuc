import test from "node:test";
import assert from "node:assert/strict";
import { getUserPermissions, hasPermission, canTranslate } from "../src/lib/admin-permissions";

test("tài khoản FAQ không có quyền đọc bài viết hoặc tuyển sinh", () => {
  const user = { permissions: '["faq"]' };
  assert.equal(hasPermission(user, "faq"), true);
  assert.equal(hasPermission(user, "posts"), false);
  assert.equal(hasPermission(user, "admissions-contact"), false);
});

test("NULL giữ toàn quyền; mảng rỗng không cấp quyền", () => {
  assert.equal(hasPermission({ permissions: null }, "posts"), true);
  assert.equal(hasPermission({ permissions: "[]" }, "posts"), false);
});

test("JSON sai cấu trúc không cấp quyền hoặc làm hàm bị lỗi", () => {
  for (const permissions of ['"posts"', '{}', 'null', '["posts",1]', 'bad']) {
    assert.deepEqual(getUserPermissions({ permissions }), []);
    assert.equal(hasPermission({ permissions }, "posts"), false);
  }
});

test("chỉ module nội dung được dùng dịch", () => {
  assert.equal(canTranslate({ permissions: '["media","users"]' }), false);
  assert.equal(canTranslate({ permissions: '["faq"]' }), true);
  assert.equal(canTranslate({ permissions: null }), true);
});
