import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { FacultyAttribute } from "@/lib/db/schema";
import { upsertFacultyAttributeAction, deleteFacultyAttributeAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Học hàm / Học vị / Chức vụ" };

const SECTIONS = [
  { type: "academic_rank" as const, title: "Học hàm", placeholder: "VD: PGS" },
  { type: "degree" as const, title: "Học vị", placeholder: "VD: ThS.BS" },
  { type: "position" as const, title: "Chức vụ", placeholder: "VD: Trưởng khoa" },
];

function AttributeSection({
  title,
  placeholder,
  type,
  items,
}: {
  title: string;
  placeholder: string;
  type: string;
  items: FacultyAttribute[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mb-3 text-sm font-semibold text-brand-900">{title}</div>
      {items.length > 0 ? (
        <ul className="mb-3.5 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg bg-paper-alt px-3 py-2 text-[13px]"
            >
              <form action={upsertFacultyAttributeAction} className="flex flex-1 items-center gap-1.5">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="type" value={type} />
                <input
                  name="name"
                  aria-label={`Tên ${item.name}`}
                  required
                  defaultValue={item.name}
                  className="w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 font-medium text-ink outline-none focus:border-line focus:bg-white"
                />
                <button
                  type="submit"
                  className="shrink-0 text-[11px] font-semibold text-brand-700 hover:underline"
                >
                  Lưu
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteFacultyAttributeAction(item.id);
                }}
              >
                <ConfirmDeleteButton
                  className="text-[11px] font-semibold text-accent-600 hover:underline"
                  confirmMessage={`Xoá "${item.name}"? Giảng viên đang dùng giá trị này sẽ không tự đổi.`}
                >
                  Xoá
                </ConfirmDeleteButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mb-3.5 text-[13px] text-ink-faint">Chưa có mục nào.</div>
      )}
      <form action={upsertFacultyAttributeAction} className="flex gap-2">
        <input type="hidden" name="type" value={type} />
        <input
          name="name"
          aria-label={placeholder}
          required
          placeholder={placeholder}
          // min-w-0: ô nhập có độ rộng mặc định của trình duyệt, không co thì đẩy nút "Thêm" ra ngoài khung trên mobile.
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand-700 px-3.5 py-2 text-[13px] font-semibold text-white"
        >
          Thêm
        </button>
      </form>
    </div>
  );
}

export default async function AdminFacultyAttributesPage() {
  await requirePermission("faculty");
  const all = await db.query.facultyAttributes.findMany({
    orderBy: [asc(schema.facultyAttributes.sortOrder), asc(schema.facultyAttributes.seq)],
  });
  const byType = (type: string) => all.filter((a) => a.type === type);

  return (
    <div>
      <AdminTopbar
        title="Học hàm / Học vị / Chức vụ"
        description="Danh sách dùng chung khi tạo Giảng viên — thêm sẵn ở đây để chọn qua dropdown, tránh gõ tay không đồng nhất"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <AttributeSection
            key={s.type}
            title={s.title}
            placeholder={s.placeholder}
            type={s.type}
            items={byType(s.type)}
          />
        ))}
      </div>
    </div>
  );
}
