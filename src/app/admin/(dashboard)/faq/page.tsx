import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertFaqAction, deleteFaqAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Câu hỏi thường gặp" };

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("faq");
  const { edit } = await searchParams;
  const allFaqs = await db.query.faqs.findMany({ orderBy: asc(schema.faqs.sortOrder) });
  const editing = edit
    ? await db.query.faqs.findFirst({ where: eq(schema.faqs.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Câu hỏi thường gặp"
        description="Danh sách FAQ hiển thị ở /faq — vị trí càng nhỏ hiện càng trước"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allFaqs.length})
            </span>
          </div>
          {allFaqs.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có câu hỏi nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allFaqs.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      #{f.sortOrder} · {f.question}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-ink-faint">{f.answer}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/faq?edit=${f.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deleteFaqAction(f.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        confirmMessage={`Xoá câu hỏi "${f.question}"? Không thể hoàn tác.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? "Sửa câu hỏi" : "Thêm câu hỏi"}
            </span>
            {editing && (
              <a href="/admin/faq" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertFaqAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Câu hỏi</label>
              <input
                name="question"
                required
                defaultValue={editing?.question}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Học phí năm 2026 là bao nhiêu?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Câu trả lời</label>
              <textarea
                name="answer"
                required
                rows={4}
                defaultValue={editing?.answer}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <details className="rounded-lg border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                🇬🇧 Bản tiếng Anh (tuỳ chọn)
              </summary>
              <div className="mt-3 space-y-3">
                <AutoTranslateButton
                  pairs={[
                    { viName: "question", enName: "questionEn" },
                    { viName: "answer", enName: "answerEn" },
                  ]}
                />
                <input
                  name="questionEn"
                  defaultValue={editing?.questionEn ?? ""}
                  placeholder="Question (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <textarea
                  name="answerEn"
                  rows={4}
                  defaultValue={editing?.answerEn ?? ""}
                  placeholder="Answer (English)"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </details>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Vị trí (số nhỏ hiện trước)
              </label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allFaqs.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm câu hỏi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
