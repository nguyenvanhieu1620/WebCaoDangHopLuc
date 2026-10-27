import test from "node:test";
import assert from "node:assert/strict";
import { filterAdmissions, parseDateFilter } from "../src/app/admin/(dashboard)/tuyen-sinh/filter";
import { publicPageContent } from "../src/lib/public-content";
import type { AdmissionSubmission } from "../src/lib/db/schema";

const rows: AdmissionSubmission[] = [
  { id: "a", seq: 1, fullName: "Đặng Thị An", phone: "0901234567", idNumber: "000000000001", email: "", program: "Dược", note: "", status: "new", createdAt: "2026-10-01 17:30:00" },
  { id: "b", seq: 2, fullName: "Nguyễn Bình", phone: "0901234568", idNumber: "000000000002", email: "", program: "Điều dưỡng", note: "", status: "reviewed", createdAt: "2026-10-02 17:30:00" },
];

test("lọc hồ sơ kết hợp ngành, trạng thái, không dấu và ngày Việt Nam gồm cả hai đầu", () => {
  assert.deepEqual(filterAdmissions(rows, { q: "dang thi", status: "new", program: "Dược", from: "2026-10-02", to: "2026-10-02" }).map((s) => s.id), ["a"]);
  assert.equal(filterAdmissions(rows, { status: "all", to: "2026-10-01" }).length, 0);
  assert.deepEqual(filterAdmissions(rows, { status: "all", from: "2026-10-03" }).map((s) => s.id), ["b"]);
  assert.equal(filterAdmissions(rows, { status: "all", program: "Dược", q: "binh" }).length, 0);
  assert.equal(filterAdmissions(rows, { status: "reviewed", program: "Dược" }).length, 0);
});

test("ngày sai không làm hỏng danh sách; khoảng ngày đảo trả danh sách rỗng", () => {
  for (const date of ["bad", "2026-02-30", "2026-13-01", "2026-1-01"]) assert.equal(parseDateFilter(date), "");
  assert.equal(parseDateFilter("2028-02-29"), "2028-02-29");
  assert.equal(filterAdmissions(rows, { status: "all", from: "bad" }).length, 2);
  assert.equal(filterAdmissions(rows, { status: "all", from: "2026-10-03", to: "2026-10-02" }).length, 0);
});

test("nội dung công khai bỏ hướng dẫn nội bộ nhưng giữ link/ảnh và bản nguồn", () => {
  const raw = "## Lịch sử\n[Trường điền: năm thành lập]\n\nXem [quy chế](/quy-che) và ![ảnh](/anh.jpg).";
  const result = publicPageContent(raw, "gioi-thieu", "vi");
  assert.ok(!result.includes("Trường điền"));
  assert.match(result, /Thông tin đang được cập nhật/);
  assert.ok(result.includes("[quy chế](/quy-che)"));
  assert.ok(result.includes("![ảnh](/anh.jpg)"));
  assert.ok(raw.includes("Trường điền"));
});

test("template công khai cũ thành danh sách, không nhân đôi năm học hoặc bịa số liệu", () => {
  const raw = "— Học phí năm học [điền năm học]: [điền học phí]\n— Tổng chi năm [điền năm]: [điền số liệu]\n\n[Ban Tài chính cập nhật trước khi công bố]";
  const result = publicPageContent(raw, "cong-khai-tai-chinh", "vi");
  assert.match(result, /^- Học phí: Đang cập nhật\n- Tổng chi: Đang cập nhật/);
  assert.ok(!result.includes("[điền"));
  assert.match(publicPageContent("[Trường điền: nội dung]", "lien-he", "en"), /Information is being updated/);
});
