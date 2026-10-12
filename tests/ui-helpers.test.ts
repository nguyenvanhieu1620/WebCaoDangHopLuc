import test from "node:test";
import assert from "node:assert/strict";
import { toCsv, digitsCell } from "../src/lib/csv";
import { IMAGE_SPECS, assessImage } from "../src/lib/image-specs";
import { checkUpload } from "../src/lib/upload-rules";
import { dbTimestampToISO, formatDbDateTime, hasPlaceholder, normalizeExternalUrl, normalizeSearch, normalizeZaloUrl, staticPageHref, vnDateKey, youtubeId } from "../src/lib/utils";

test("CSV có BOM, CRLF, nháy kép được nhân đôi", () => {
  const csv = toCsv(["Họ tên", "Ghi chú"], [["Nguyễn Văn An", 'nói "xin chào"\nxuống dòng']]);
  assert.ok(csv.startsWith("﻿"), "thiếu BOM thì Excel đọc sai tiếng Việt");
  assert.ok(csv.includes("\r\n"));
  assert.ok(csv.includes('"nói ""xin chào""\nxuống dòng"'));
});

test("CSV chặn công thức Excel từ dữ liệu người ngoài nhập", () => {
  const csv = toCsv(["a"], [["=HYPERLINK(\"http://x\")"], ["+1"], ["-2"], ["@cmd"], ["0901234567"]]);
  const lines = csv.replace("﻿", "").trim().split("\r\n").slice(1);
  assert.deepEqual(lines, ['"\'=HYPERLINK(""http://x"")"', '"\'+1"', '"\'-2"', '"\'@cmd"', '"0901234567"']);
});

test("SĐT/CCCD giữ dạng chữ trong Excel, giá trị lạ vẫn bị chặn công thức", () => {
  const csv = toCsv(["sdt", "cccd", "x"], [[digitsCell("0901234567"), digitsCell("038201001234"), digitsCell("=1+1")]]);
  const row = csv.replace("﻿", "").trim().split("\r\n")[1];
  assert.equal(row, '"=""0901234567""","=""038201001234""","\'=1+1"');
  assert.equal(digitsCell(null), null);
});

test("hasPlaceholder bắt [Trường điền…] nhưng bỏ qua link Markdown", () => {
  assert.equal(hasPlaceholder("Học phí: [Trường điền: số tiền]"), true);
  assert.equal(hasPlaceholder("Xem [quy chế](/cong-khai/quy-che) tại đây"), false);
  assert.equal(hasPlaceholder(null), false);
  assert.equal(hasPlaceholder("[x]"), false, "1 ký tự (ô checkbox) không phải placeholder");
});

test("normalizeSearch tìm được không dấu, kể cả chữ đ", () => {
  assert.equal(normalizeSearch("  Điều   Dưỡng "), "dieu duong");
  assert.ok(normalizeSearch("Xét nghiệm Y học").includes(normalizeSearch("xet nghiem")));
});

test("timestamp DB (UTC, không múi giờ) hiển thị đúng giờ Việt Nam", () => {
  assert.equal(dbTimestampToISO("2026-10-01 17:30:00"), "2026-10-01T17:30:00Z");
  assert.equal(dbTimestampToISO("2026-10-01T17:30:00.000Z"), "2026-10-01T17:30:00.000Z");
  // 17:30 UTC = 00:30 ngày hôm sau ở Việt Nam
  assert.match(formatDbDateTime("2026-10-01 17:30:00"), /2\/10\/2026.*00:30/);
  assert.equal(vnDateKey("2026-10-01T17:30:00Z"), "2026-10-02");
  assert.equal(vnDateKey("2026-10-01T16:59:00Z"), "2026-10-01");
});

test("youtubeId nhận các dạng link YouTube phổ biến, link khác trả null", () => {
  const id = "dQw4w9WgXcQ";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ]) {
    assert.equal(youtubeId(url), id, url);
  }
  assert.equal(youtubeId("https://www.facebook.com/watch/?v=123"), null);
  assert.equal(youtubeId("https://vimeo.com/123456"), null);
  assert.equal(youtubeId("https://www.youtube.com/watch?v=short"), null, "ID sai độ dài");
  assert.equal(youtubeId("không phải link"), null);
  assert.equal(youtubeId(null), null);
});

test("staticPageHref chỉ trả đường dẫn cho trang tĩnh có route công khai", () => {
  assert.equal(staticPageHref("gioi-thieu"), "/gioi-thieu");
  assert.equal(staticPageHref("lien-he"), "/lien-he");
  assert.equal(staticPageHref("chinh-sach-bao-mat"), "/chinh-sach-bao-mat");
  assert.equal(staticPageHref("cong-khai-tai-chinh"), "/cong-khai/cong-khai-tai-chinh");
  assert.equal(staticPageHref("trang-noi-bo"), null);
});

test("normalizeExternalUrl sửa link mạng xã hội dán sai, chặn giá trị không phải link", () => {
  const fb = "https://www.facebook.com/truongcaodangyduochopluc?locale=vi_VN";
  assert.equal(normalizeExternalUrl(`#${fb}`), fb, "dấu # lỡ dính ở đầu");
  assert.equal(normalizeExternalUrl(`  ${fb}  `), fb);
  assert.equal(normalizeExternalUrl("facebook.com/hopluc"), "https://facebook.com/hopluc", "thiếu https://");
  assert.equal(normalizeExternalUrl("www.youtube.com/@hopluc"), "https://www.youtube.com/@hopluc");
  assert.equal(normalizeExternalUrl("//zalo.me/0912345678"), "https://zalo.me/0912345678");
  assert.equal(normalizeExternalUrl("http://lms.example.vn/login"), "http://lms.example.vn/login");
  for (const bad of ["", "#", "  # ", "javascript:alert(1)", "mailto:a@b.vn", "không phải link", "localhost:3000", null, undefined]) {
    assert.equal(normalizeExternalUrl(bad), null, String(bad));
  }
});

test("normalizeZaloUrl nhận cả số điện thoại lẫn link zalo.me", () => {
  assert.equal(normalizeZaloUrl("0912 345 678"), "https://zalo.me/0912345678");
  assert.equal(normalizeZaloUrl("#0912.345.678"), "https://zalo.me/0912345678");
  assert.equal(normalizeZaloUrl("+84912345678"), "https://zalo.me/84912345678");
  assert.equal(normalizeZaloUrl("zalo.me/0912345678"), "https://zalo.me/0912345678");
  assert.equal(normalizeZaloUrl("123"), null, "quá ngắn, không phải số điện thoại");
  assert.equal(normalizeZaloUrl("#"), null);
});

test("checkUpload chặn sai định dạng, HEIC, quá dung lượng — cùng quy tắc trình duyệt + máy chủ", () => {
  const MB = 1024 * 1024;
  assert.equal(checkUpload({ name: "a.jpg", type: "image/jpeg", size: 2 * MB }, ["image"]), null);
  assert.match(checkUpload({ name: "b.jpg", type: "image/jpeg", size: 11 * MB }, ["image"]) ?? "", /11MB — tối đa 10MB/);
  assert.match(checkUpload({ name: "IMG_1.HEIC", type: "", size: MB }, ["image"]) ?? "", /HEIC/);
  assert.match(checkUpload({ name: "c.pdf", type: "application/pdf", size: MB }, ["image"]) ?? "", /chỉ nhận ảnh/);
  assert.equal(checkUpload({ name: "c.pdf", type: "application/pdf", size: 19 * MB }, ["document"]), null);
  assert.match(checkUpload({ name: "v.mp4", type: "video/mp4", size: 51 * MB }, ["image", "video"]) ?? "", /tối đa 50MB/);
});

test("assessImage cảnh báo ảnh nhỏ, sai hướng, logo JPG; đạt chuẩn thì báo ok", () => {
  assert.deepEqual(assessImage(IMAGE_SPECS.hero, 2560, 1440).map((n) => n.level), ["ok"]);
  assert.ok(assessImage(IMAGE_SPECS.hero, 800, 450)[0].text.includes("Ảnh 800×450 nhỏ hơn khuyến nghị (tối thiểu 1920×1080)"));
  assert.ok(assessImage(IMAGE_SPECS.hero, 2000, 3000).some((n) => /Ảnh dọc/.test(n.text)), "ảnh dọc cho banner ngang");
  assert.ok(assessImage(IMAGE_SPECS.portrait, 1600, 1200).some((n) => /Ảnh ngang/.test(n.text)), "ảnh ngang cho chân dung");
  assert.deepEqual(assessImage(IMAGE_SPECS.logo, 300, 120).map((n) => n.level), ["ok"], "logo chỉ xét chiều cao");
  assert.ok(assessImage(IMAGE_SPECS.logo, 300, 120, true).some((n) => /JPG/.test(n.text)));
  assert.ok(assessImage(IMAGE_SPECS.logo, 200, 200).some((n) => /Logo vuông/.test(n.text)));
});
