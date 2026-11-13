import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { upsertFaqAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa câu hỏi thường gặp — dùng chung cho `them-moi/` và `[id]/`. */
export async function FaqFormPage({ id }: { id?: string }) {
  await requirePermission("faq");
  const editing = id ? await db.query.faqs.findFirst({ where: eq(schema.faqs.id, id) }) : null;
  if (id && !editing) notFound();
  const [{ total }] = await db.select({ total: count() }).from(schema.faqs);

  return (
    <AdminFormLayout
      title={editing ? "Sửa câu hỏi" : "Thêm câu hỏi"}
      description="Hiển thị ở /faq và cuối trang Tuyển sinh — vị trí càng nhỏ hiện càng trước"
      backHref="/admin/faq"
    >
      <AdminSaveForm
        key={id ?? "new"}
        action={upsertFaqAction}
        unknownResultMessage="Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và danh sách câu hỏi trước khi thử lại."
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-faq-question" className="mb-1.5 block text-xs font-semibold text-ink-soft">Câu hỏi</label>
          <input
            id="f-faq-question"
            name="question"
            required
            defaultValue={editing?.question}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Học phí năm 2026 là bao nhiêu?"
          />
        </div>
        <div>
          <label htmlFor="f-faq-answer" className="mb-1.5 block text-xs font-semibold text-ink-soft">Câu trả lời</label>
          <textarea
            id="f-faq-answer"
            name="answer"
            required
            rows={6}
            defaultValue={editing?.answer}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "question", enName: "questionEn" },
                { viName: "answer", enName: "answerEn" },
              ]}
            />
            <input
              aria-label="Question (English)"
              name="questionEn"
              defaultValue={editing?.questionEn ?? ""}
              placeholder="Question (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <textarea
              aria-label="Answer (English)"
              name="answerEn"
              rows={6}
              defaultValue={editing?.answerEn ?? ""}
              placeholder="Answer (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-faq-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
            <input
              id="f-faq-sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={editing?.sortOrder ?? total}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="f-faq-isVisible" className="mb-1.5 block text-xs font-semibold text-ink-soft">Hiển thị trên web</label>
            <select
              id="f-faq-isVisible"
              name="isVisible"
              defaultValue={String(editing?.isVisible ?? 1)}
              aria-describedby="f-faq-visibility-help"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="1">Đang hiển thị</option>
              <option value="0">Tạm ẩn</option>
            </select>
            <p id="f-faq-visibility-help" className="mt-1.5 text-xs leading-relaxed text-ink-soft">Tạm ẩn khỏi FAQ, Tuyển sinh và tìm kiếm. Bạn có thể bật lại tại đây.</p>
          </div>
        </div>
        <FormActions cancelHref="/admin/faq" submitLabel={editing ? "Lưu thay đổi" : "Thêm câu hỏi"} />
      </AdminSaveForm>
    </AdminFormLayout>
  );
}
