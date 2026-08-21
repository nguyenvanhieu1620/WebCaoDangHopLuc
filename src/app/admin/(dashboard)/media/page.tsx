import type { Metadata } from "next";
import Image from "next/image";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { uploadMediaAction, deleteMediaAction } from "./actions";
import { cn } from "@/lib/utils";

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
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = type === "image" || type === "video" ? type : "all";

  const allItems = await db.query.mediaItems.findMany({
    orderBy: desc(schema.mediaItems.createdAt),
  });
  const items = activeType === "all" ? allItems : allItems.filter((i) => i.type === activeType);

  return (
    <div>
      <AdminTopbar
        title="Thư viện media"
        description={`${allItems.length} tệp — ảnh/video dùng chung cho toàn site`}
      />
      <div className="p-8">
        <form
          action={uploadMediaAction}
          className="mb-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 px-8 py-10 text-center"
        >
          <div className="font-display text-[17px] font-semibold text-ink">
            Chọn tệp để tải lên
          </div>
          <div className="text-[13px] text-ink-faint">
            Hỗ trợ JPG, PNG, WEBP, GIF, MP4, WEBM · Tối đa 10MB ảnh / 50MB video
          </div>
          <input
            type="file"
            name="files"
            multiple
            required
            accept="image/*,video/mp4,video/webm"
            className="mt-2 text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-brand-700 file:shadow-sm2"
          />
          <button
            type="submit"
            className="mt-1 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-bold text-white"
          >
            Tải lên
          </button>
        </form>

        <div className="mb-5 flex items-center gap-2.5">
          {FILTERS.map((f) => (
            <a
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
            </a>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có tệp nào. Tải lên ở khu vực phía trên.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm2"
              >
                <div className="relative h-[110px] bg-paper-alt">
                  {item.type === "image" ? (
                    <Image src={item.url} alt={item.filename} fill className="object-cover" />
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
                    <span className="text-[10px] text-ink-faint">{item.type}</span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteMediaAction(item.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-[10.5px] font-semibold text-accent-600 hover:underline"
                      >
                        Xoá
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
