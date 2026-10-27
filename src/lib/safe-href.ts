/** Chỉ cho điều hướng nội bộ, anchor, http(s) và các kênh liên hệ đã biết. */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  const unsafeCharacter = [...value].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === "\\");
  if (!value || value.length > 2048 || unsafeCharacter) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/")) return value.startsWith("//") ? null : value;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.hostname && !url.username && !url.password ? url.href : null;
    }
    if (["tel:", "mailto:", "sms:"].includes(url.protocol) && url.pathname) return value;
  } catch { /* Giá trị không phải URL hợp lệ. */ }
  return null;
}
