import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { deleteMediaAction } from "./actions";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import Link from "next/link";
import { AdminNewButton } from "@/components/admin/AdminFormLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { CopyTextButton } from "@/components/admin/CopyTextButton";
import { paginate } from "@/lib/pagination";

export const metadata: Metadata = { title: "Thư viện media" };

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "image", label: "Ảnh" },
  { key: "video", label: "Video" },
] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; uploaded?: string }>;
}) {
  await requirePermission("media");
  const { type, page, uploaded } = await searchParams;
  const activeType = type === "image" || type === "video" ? type : "all";

  const allItems = await db.query.mediaItems.findMany({
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });
  const items = activeType === "all" ? allItems : allItems.filter((i) => i.type === activeType);
  // 24 = 4 hàng × 6 cột ở màn hình rộng.
  const pg = paginate(items, page, 24);
  const uploadedCount = Number(uploaded) || 0;

  return (
    <div>
      <AdminTopbar
        title="Thư viện media"
        description={`${allItems.length} tệp — ảnh/video dùng chung cho toàn site`}
        actions={<AdminNewButton href="/admin/media/tai-len" label="Tải lên" />}
      />
      <div className="p-5 sm:p-8">
        {uploadedCount > 0 && (
          <div role="status" className="mb-5 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            ✓ Đã tải lên {uploadedCount} tệp.
          </div>
        )}

        <div className="mb-5 flex items-center gap-2.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/media" : `/admin/media?type=${f.key}`}
              className={cn(
                "rounded-lg px-4 py-2 text-[13px] font-semibold",
                activeType === f.key
                  ? "bg-brand-700 text-white"
                  : "border border-line bg-white text-ink-soft hover:border-brand-500"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có tệp nào.{" "}
            <Link href="/admin/media/tai-len" className="font-semibold text-brand-700 hover:underline">
              Tải tệp lên
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {pg.items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm2"
              >
                <div className="relative h-[110px] bg-paper-alt">
                  {item.type === "image" ? (
                    <Image src={item.url} alt={item.filename} fill sizes="200px" className="object-cover" />
                  ) : (
                    <video src={item.url} className="h-full w-full object-cover" muted />
                  )}
                  {item.type === "video" && (
                    <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
                      VIDEO
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="truncate text-[11.5px] font-semibold text-ink">
                    {item.filename}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <CopyTextButton text={item.url} className="text-[10.5px] font-semibold text-brand-700 hover:underline" />
                    <form
                      action={async () => {
                        "use server";
                        await deleteMediaAction(item.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="text-[10.5px] font-semibold text-accent-600 hover:underline"
                        confirmMessage={`Xoá tệp "${item.filename}"? File vật lý cũng sẽ bị xoá, không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-5 rounded-2xl border border-line bg-white">
            <AdminPagination
              pagination={pg}
              basePath="/admin/media"
              params={{ type: activeType === "all" ? undefined : activeType }}
              unit="tệp"
            />
          </div>
        )}
      </div>
    </div>
  );
}
