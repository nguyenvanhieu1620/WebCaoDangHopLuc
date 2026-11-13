import { isFacultyDraftToken } from "./draft";

type QueryValue = string | string[];

export type FacultyListParams = {
  q?: QueryValue;
  department?: QueryValue;
  page?: QueryValue;
};

export function facultyListSearch(params: FacultyListParams, saved = false, draftToken?: unknown): string {
  const query = new URLSearchParams();
  for (const key of ["q", "department", "page"] as const) {
    const raw = params?.[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === "string" && value.trim()) query.set(key, value.trim());
  }
  if (saved) {
    query.set("saved", "1");
    if (isFacultyDraftToken(draftToken)) query.set("draft", draftToken);
  }
  const search = query.toString();
  return search ? `?${search}` : "";
}
