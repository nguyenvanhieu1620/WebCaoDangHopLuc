/**
 * Gộp className có điều kiện, bỏ qua giá trị falsy.
 * Dùng thay cho clsx để không thêm dependency ngoài.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Tạo slug từ tiêu đề tiếng Việt — bỏ dấu, thay khoảng trắng bằng gạch ngang. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
