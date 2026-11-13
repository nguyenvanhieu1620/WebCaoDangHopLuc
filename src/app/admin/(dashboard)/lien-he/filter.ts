import type { ContactMessage } from "@/lib/db/schema";
import { normalizeSearch } from "@/lib/utils";
import { normalizeVnPhone } from "@/lib/validate";
import { isContactStatus, type ContactStatus } from "./status";

type QueryValue = string | string[] | null | undefined;
type ContactFilters = { q: string; status: "all" | ContactStatus };

export function parseContactFilters(params: { q?: QueryValue; status?: QueryValue }): ContactFilters {
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  return {
    q: q?.trim() ?? "",
    status: isContactStatus(status) ? status : "all",
  };
}

export function filterContactMessages(
  messages: ContactMessage[],
  { q, status }: ContactFilters
): ContactMessage[] {
  const nameQuery = normalizeSearch(q);
  const emailQuery = q.toLowerCase();
  const phoneQuery = normalizeVnPhone(q);
  const searchByPhone = /^\+?[0-9]+$/.test(phoneQuery);
  const localPhoneQuery = phoneQuery.replace(/^\+84(?=[1-9][0-9]{8}$)/, "0");

  return messages.filter((message) => {
    if (status !== "all" && message.status !== status) return false;
    if (!q) return true;

    if (nameQuery && normalizeSearch(message.name).includes(nameQuery)) return true;
    if ((message.email ?? "").toLowerCase().includes(emailQuery)) return true;
    if (!searchByPhone || !message.phone) return false;

    const phone = normalizeVnPhone(message.phone);
    return phone.includes(phoneQuery) || phone.replace(/^\+84(?=[1-9][0-9]{8}$)/, "0").includes(localPhoneQuery);
  });
}
