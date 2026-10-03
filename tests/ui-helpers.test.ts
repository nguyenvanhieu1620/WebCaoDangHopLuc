import test from "node:test";
import assert from "node:assert/strict";
import { toCsv, digitsCell } from "../src/lib/csv";
import { dbTimestampToISO, formatDbDateTime, hasPlaceholder, normalizeSearch, vnDateKey, youtubeId } from "../src/lib/utils";

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

test("timestamp SQLite (UTC, không múi giờ) hiển thị đúng giờ Việt Nam", () => {
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
