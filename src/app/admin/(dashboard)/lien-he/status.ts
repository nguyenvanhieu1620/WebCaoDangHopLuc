export const CONTACT_STATUS_LABELS = {
  new: "Mới",
  read: "Đã xem",
  replied: "Đã phản hồi",
} as const;

export type ContactStatus = keyof typeof CONTACT_STATUS_LABELS;

export function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === "string" && Object.hasOwn(CONTACT_STATUS_LABELS, value);
}

export function contactStatusLabel(status: string): string {
  return isContactStatus(status) ? CONTACT_STATUS_LABELS[status] : status;
}
