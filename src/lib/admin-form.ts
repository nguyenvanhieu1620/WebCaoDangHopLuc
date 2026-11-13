/** So sánh dữ liệu đang soạn, kể cả tệp đã chọn, bỏ qua trường nội bộ của Server Action. */
export function snapshotAdminForm(form: HTMLFormElement): string {
  return JSON.stringify(
    [...new FormData(form)]
      .filter(([key]) => !key.startsWith("$ACTION_"))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name ? [value.name, value.size, value.lastModified] : "",
      ])
  );
}

export const RESTORE_ADMIN_FORM_DRAFT = "hopluc:restore-admin-form-draft";

export type AdminSaveResult = { message: string; fields?: Partial<Record<string, string>> };
