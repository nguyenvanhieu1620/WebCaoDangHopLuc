"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ADMIN_NAV } from "@/lib/constants";
import { cn, normalizeSearch } from "@/lib/utils";
import { adminSearchAction, type AdminSearchResult } from "@/lib/actions/admin-search-actions";
import { AdminIcon } from "@/components/admin/AdminIcon";

type PaletteItem = AdminSearchResult & { icon?: string; external?: boolean };

const GROUP_ICON: Record<string, string> = {
  "Bài viết": "posts",
  "Ngành đào tạo": "programs",
  "Giảng viên": "faculty",
  "Sự kiện": "events",
  "Trang tĩnh": "pages",
  "Hồ sơ tuyển sinh": "admissions-contact",
  "Tin nhắn liên hệ": "testimonials",
};

const CommandPaletteContext = createContext<{ open: () => void } | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette phải dùng bên trong AdminCommandPaletteProvider");
  return ctx;
}

/** Danh sách trang + thao tác nhanh cố định — lọc theo quyền giống sidebar. */
function buildStaticItems(permissions: string[] | null): PaletteItem[] {
  const can = (key: string) => key === "dashboard" || permissions === null || permissions.includes(key);
  const items: PaletteItem[] = [];
  for (const entity of ADMIN_NAV) {
    if (!can(entity.key)) continue;
    const leaves = entity.children ?? [{ key: entity.key, label: entity.label, href: entity.href }];
    for (const leaf of leaves) {
      items.push({
        id: `nav-${leaf.key}`,
        group: "Đi tới trang",
        label: entity.children ? `${entity.label} › ${leaf.label}` : leaf.label,
        hint: entity.section,
        href: leaf.href,
        icon: entity.key,
      });
    }
  }
  if (can("posts")) items.push({ id: "act-new-post", group: "Thao tác nhanh", label: "Viết bài mới", href: "/admin/bai-viet/them-moi", icon: "plus" });
  if (can("events")) items.push({ id: "act-new-event", group: "Thao tác nhanh", label: "Thêm sự kiện", href: "/admin/su-kien/them-moi", icon: "plus" });
  if (can("admissions-contact")) {
    items.push({ id: "act-export-admissions", group: "Thao tác nhanh", label: "Xuất Excel hồ sơ tuyển sinh", href: "/admin/tuyen-sinh/xuat-csv", icon: "admissions-contact", external: true });
  }
  items.push({ id: "act-view-site", group: "Thao tác nhanh", label: "Xem website", href: "/", icon: "external", external: true });
  return items;
}

/**
 * Bảng lệnh Ctrl+K / ⌘K kiểu Linear/Strapi: gõ để nhảy tới trang quản trị,
 * thao tác nhanh, hoặc mở thẳng bản ghi (bài viết, ngành, giảng viên, hồ sơ…
 * qua `adminSearchAction`, chỉ trả về module được cấp quyền). Provider bọc
 * cả khu vực admin để Sidebar/Topbar mở được bằng nút bấm (`useCommandPalette`).
 */
export function AdminCommandPaletteProvider({
  children,
  permissions,
}: {
  children: ReactNode;
  permissions: string[] | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<AdminSearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [isPending, startTransition] = useTransition();
  const latestQuery = useRef("");
  const listRef = useRef<HTMLUListElement>(null);
  const staticItems = useMemo(() => buildStaticItems(permissions), [permissions]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setRecords([]);
    setActive(0);
  }, []);

  // Phím tắt toàn cục: Ctrl+K / ⌘K mở-đóng, "/" mở khi không đang gõ trong ô nhập.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tìm bản ghi trên server — chờ 220ms sau lần gõ cuối, bỏ kết quả của truy vấn cũ.
  useEffect(() => {
    const q = query.trim();
    latestQuery.current = q;
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const found = await adminSearchAction(q);
        if (latestQuery.current === q) setRecords(found);
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = normalizeSearch(query);
    const statics = q
      ? staticItems.filter((i) => normalizeSearch(`${i.label} ${i.hint ?? ""} ${i.group}`).includes(q))
      : staticItems;
    const dynamic = query.trim().length >= 2 ? records.map((r) => ({ ...r, icon: GROUP_ICON[r.group] })) : [];
    return [...dynamic, ...statics];
  }, [query, records, staticItems]);

  const activeIndex = Math.min(active, Math.max(items.length - 1, 0));

  function go(item: PaletteItem) {
    close();
    if (item.external) window.open(item.href, "_blank", "noopener,noreferrer");
    else router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((activeIndex + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((activeIndex - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const ctx = useMemo(() => ({ open }), [open]);

  return (
    <CommandPaletteContext.Provider value={ctx}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
          <div className="palette-backdrop absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={close} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tìm nhanh trong trang quản trị"
            className="palette-panel relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_30px_80px_-20px_rgba(6,50,90,0.55)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <AdminIcon name="search" className="h-5 w-5 shrink-0 text-ink-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Tìm trang, bài viết, ngành, giảng viên, hồ sơ…"
                role="combobox"
                aria-expanded="true"
                aria-controls="admin-palette-list"
                aria-activedescendant={items[activeIndex] ? `palette-${items[activeIndex].id}` : undefined}
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
              />
              {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" aria-hidden="true" />}
              <kbd className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">Esc</kbd>
            </div>
            <ul id="admin-palette-list" ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-ink-faint">
                  {isPending ? "Đang tìm…" : "Không tìm thấy kết quả phù hợp."}
                </li>
              ) : (
                items.map((item, i) => {
                  const showGroup = i === 0 || items[i - 1].group !== item.group;
                  return (
                    <li key={item.id} role="none">
                      {showGroup && (
                        <div className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        id={`palette-${item.id}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        data-index={i}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                          i === activeIndex ? "bg-brand-700 text-white" : "text-ink hover:bg-paper-alt"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            i === activeIndex ? "bg-white/15" : "bg-brand-50 text-brand-700"
                          )}
                        >
                          <AdminIcon name={item.icon ?? "search"} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                        {item.hint && (
                          <span className={cn("max-w-[40%] shrink-0 truncate text-[12px]", i === activeIndex ? "text-white/75" : "text-ink-faint")}>
                            {item.hint}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="flex flex-wrap items-center gap-4 border-t border-line bg-paper/70 px-4 py-2.5 text-[11px] text-ink-faint">
              <span><kbd className="font-mono">↑↓</kbd> chọn</span>
              <span><kbd className="font-mono">Enter</kbd> mở</span>
              <span><kbd className="font-mono">Ctrl K</kbd> bật/tắt</span>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}
