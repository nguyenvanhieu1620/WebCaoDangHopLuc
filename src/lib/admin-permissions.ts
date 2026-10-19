type PermissionUser = { permissions: string | null };

/** Quyền không đúng cấu trúc phải bị từ chối, kể cả JSON hợp lệ. */
export function getUserPermissions(user: PermissionUser): string[] | null {
  if (user.permissions === null) return null;
  try {
    const parsed: unknown = JSON.parse(user.permissions);
    return Array.isArray(parsed) && parsed.every((key) => typeof key === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export function hasPermission(user: PermissionUser, moduleKey: string): boolean {
  const permissions = getUserPermissions(user);
  return permissions === null || permissions.includes(moduleKey);
}

const TRANSLATABLE_MODULES = [
  "posts", "programs", "faculty", "partners", "events", "faq",
  "homepage", "pages", "menu", "admissions-contact", "site-settings",
];

export function canTranslate(user: PermissionUser): boolean {
  return TRANSLATABLE_MODULES.some((key) => hasPermission(user, key));
}
