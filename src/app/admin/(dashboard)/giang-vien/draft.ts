const DRAFT_FIELDS = [
  "name", "role", "departmentId", "degree", "academicRank", "specialty", "bio", "sortOrder",
  "roleEn", "degreeEn", "academicRankEn", "specialtyEn", "bioEn", "photoExisting",
] as const;
const MAX_DRAFT_AGE = 24 * 60 * 60 * 1000;

export type FacultyDraftContent = { values: Record<string, string>; reselectPhoto: boolean };
export type FacultyDraft = FacultyDraftContent & { version: string; savedAt: number; token?: string };

export function facultyDraftPrefix(userId: string) {
  return `hopluc-faculty:${userId}:`;
}

export function isFacultyDraftToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/.test(value);
}

export function captureFacultyDraft(formData: FormData): FacultyDraftContent {
  const values: Record<string, string> = {};
  for (const key of DRAFT_FIELDS) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  const photo = formData.get("photo");
  return { values, reselectPhoto: photo instanceof File && photo.size > 0 };
}

export function facultyDraftChanges(original: FacultyDraftContent, current: FacultyDraftContent): FacultyDraftContent {
  const values = Object.fromEntries(Object.entries(current.values).filter(([key, value]) => original.values[key] !== value));
  return { values, reselectPhoto: current.reselectPhoto };
}

export function parseFacultyDraft(raw: string, now = Date.now()): FacultyDraft | null {
  try {
    const draft = JSON.parse(raw) as Partial<FacultyDraft> | null;
    if (
      !draft || typeof draft.version !== "string" || typeof draft.savedAt !== "number" ||
      draft.savedAt > now || now - draft.savedAt >= MAX_DRAFT_AGE ||
      !draft.values || typeof draft.values !== "object"
    ) return null;

    const values: Record<string, string> = {};
    for (const key of DRAFT_FIELDS) {
      const value = draft.values[key];
      if (typeof value === "string") values[key] = value;
    }
    return {
      version: draft.version,
      savedAt: draft.savedAt,
      values,
      reselectPhoto: draft.reselectPhoto === true,
      token: isFacultyDraftToken(draft.token) ? draft.token : undefined,
    };
  } catch {
    return null;
  }
}

export function removeSavedFacultyDraft(
  storage: Pick<Storage, "length" | "key" | "getItem" | "removeItem">,
  userId: string,
  token: unknown,
) {
  if (!isFacultyDraftToken(token)) return;
  const prefix = facultyDraftPrefix(userId);
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const raw = storage.getItem(key);
    if (raw && parseFacultyDraft(raw)?.token === token) {
      storage.removeItem(key);
      return;
    }
  }
}
