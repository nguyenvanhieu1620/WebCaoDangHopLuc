"use client";

import { useState } from "react";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { FormActions } from "@/components/admin/FormActions";
import type { AdmissionItem } from "@/lib/db/schema";
import { upsertAdmissionItemAction } from "./actions";
import { SECTIONS, sectionType, type AdmissionItemType } from "./sections";

const inputClass = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

export function AdmissionItemFields({
  editing, initialType, defaultSortOrder, backHref,
}: {
  editing: AdmissionItem | null | undefined;
  initialType: AdmissionItemType;
  defaultSortOrder: number;
  backHref: string;
}) {
  const [type, setType] = useState(initialType);
  const showTime = type === "timeline";

  return (
    <AdminSaveForm
      action={upsertAdmissionItemAction}
      unknownResultMessage="Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và danh sách mục tuyển sinh trước khi thử lại."
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div>
        <label htmlFor="ai-type" className="mb-1.5 block text-xs font-semibold text-ink-soft">Thuộc nhóm</label>
        <select id="ai-type" name="type" value={type} onChange={(event) => setType(sectionType(event.target.value))} className={inputClass}>
          {SECTIONS.map((section) => <option key={section.type} value={section.type}>{section.title}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ai-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề</label>
        <input id="ai-title" name="title" required maxLength={200} defaultValue={editing?.title} className={inputClass} placeholder="VD: Nộp hồ sơ xét tuyển" />
      </div>
      <div hidden={!showTime}>
        <label htmlFor="ai-meta" className="mb-1.5 block text-xs font-semibold text-ink-soft">Thời gian (tuỳ chọn)</label>
        <input id="ai-meta" name="meta" disabled={!showTime} maxLength={120} defaultValue={editing?.meta ?? ""} className={inputClass} placeholder="VD: 01/03 – 30/06/2026" />
      </div>
      <div>
        <label htmlFor="ai-detail" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mô tả (tuỳ chọn)</label>
        <textarea id="ai-detail" name="detail" rows={4} maxLength={600} defaultValue={editing?.detail ?? ""} className={inputClass} />
      </div>
      <details className="rounded-lg border border-line p-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
        <div className="mt-3 space-y-3">
          <AutoTranslateButton pairs={[
            { viName: "title", enName: "titleEn" },
            ...(showTime ? [{ viName: "meta", enName: "metaEn" }] : []),
            { viName: "detail", enName: "detailEn" },
          ]} />
          <input aria-label="Title (English)" name="titleEn" defaultValue={editing?.titleEn ?? ""} placeholder="Title (English)" className={inputClass} />
          <div hidden={!showTime}>
            <input aria-label="Time (English)" name="metaEn" disabled={!showTime} defaultValue={editing?.metaEn ?? ""} placeholder="Time (English)" className={inputClass} />
          </div>
          <textarea aria-label="Description (English)" name="detailEn" rows={3} defaultValue={editing?.detailEn ?? ""} placeholder="Description (English)" className={inputClass} />
        </div>
      </details>
      <div>
        <label htmlFor="ai-sort" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
        <input id="ai-sort" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? defaultSortOrder} className={`${inputClass} max-w-[200px]`} />
      </div>
      <FormActions cancelHref={backHref} submitLabel={editing ? "Lưu thay đổi" : "Thêm mục"} />
    </AdminSaveForm>
  );
}
