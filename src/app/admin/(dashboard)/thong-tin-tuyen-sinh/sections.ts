export const SECTIONS = [
  { type: "timeline", title: "Mốc thời gian", hint: "Các giai đoạn tuyển sinh — ô \"Thời gian\" hiện nổi bật trên dòng thời gian." },
  { type: "method", title: "Phương thức & điều kiện", hint: "Phương thức xét tuyển, đối tượng, điều kiện…" },
  { type: "document", title: "Hồ sơ cần chuẩn bị", hint: "Mỗi mục là 1 dòng trong danh sách kiểm tra." },
] as const;

export type AdmissionItemType = (typeof SECTIONS)[number]["type"];

export function isAdmissionItemType(value: string | undefined): value is AdmissionItemType {
  return SECTIONS.some((section) => section.type === value);
}

export function sectionType(value: string | undefined): AdmissionItemType {
  return isAdmissionItemType(value) ? value : "timeline";
}
