/** Giữ bản gốc trong CMS; ghi chú nội bộ không xuất hiện trên trang công khai. */
export function publicPageContent(content: string, slug: string, locale: "vi" | "en"): string {
  const updating = locale === "en" ? "Information is being updated. Please contact the college for details." : "Thông tin đang được cập nhật. Vui lòng liên hệ nhà trường để biết chi tiết.";
  const short = locale === "en" ? "To be announced" : "Đang cập nhật";
  let result = content.split("\n").map((line) => {
    const pattern = /\[[^\]\n]{2,}\](?!\()/g;
    const match = pattern.exec(line);
    if (!match) return line;
    if (!line.slice(0, match.index).trim()) return `> ${updating}`;
    if (slug.startsWith("cong-khai-") && /^—\s/.test(line)) {
      const label = line.slice(0, match.index).trim().replace(/\s+(năm học|năm)\s*$/i, "").replace(/:\s*$/, "");
      return `${label}: ${short}`;
    }
    return line.replace(/\[[^\]\n]{2,}\](?!\()/g, short);
  }).join("\n");
  // Template công khai cũ dùng dấu — ở đầu dòng: đổi sang danh sách Markdown thật.
  if (slug.startsWith("cong-khai-")) result = result.replace(/^—\s+/gm, "- ");
  return result;
}
