/**
 * Xuất CSV mở được bằng Excel với tiếng Việt có dấu:
 *   - BOM UTF-8 ở đầu file (thiếu BOM, Excel đọc nhầm sang mã ANSI → lỗi font).
 *   - Xuống dòng CRLF, mọi ô bọc trong dấu nháy kép, nháy kép bên trong nhân đôi.
 *   - Chặn "CSV injection": ô bắt đầu bằng = + - @ (hoặc tab/CR) bị Excel hiểu
 *     là công thức — dữ liệu này do người ngoài nhập qua form công khai, nên
 *     thêm dấu ' phía trước để Excel hiển thị như chữ thường.
 */
type Cell = string | number | null | undefined | { digits: string };

/**
 * Đánh dấu ô chỉ gồm chữ số cần giữ nguyên dạng chữ (SĐT, CCCD): nếu để
 * thường, Excel tự đổi "0901234567" thành số 901234567 (mất số 0 đầu) và
 * CCCD 12 số thành dạng 3,82E+11. Ghi thành ="0901234567" thì Excel hiển thị
 * đúng nguyên văn. Chỉ áp dụng khi giá trị thật sự chỉ có chữ số (và dấu +
 * đầu) — còn lại xử lý như ô thường, nên không mở đường cho CSV injection.
 */
export function digitsCell(value: string | null | undefined): Cell {
  return value && /^\+?\d{1,20}$/.test(value) ? { digits: value } : value;
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  const cell = (value: Cell) => {
    if (value && typeof value === "object") return `"=""${value.digits}"""`;
    let s = value == null ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers, ...rows].map((row) => row.map(cell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Response tải file CSV — tên file chỉ dùng ASCII để mọi trình duyệt đều nhận đúng. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
