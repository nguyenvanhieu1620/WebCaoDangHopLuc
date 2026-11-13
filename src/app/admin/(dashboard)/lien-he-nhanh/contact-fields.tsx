"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { FormActions } from "@/components/admin/FormActions";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import type { QuickContact } from "@/lib/db/schema";
import { upsertQuickContactAction } from "./actions";
import { TYPE_LABELS } from "./types";

const TYPE_HINTS: Record<string, string> = {
  zalo: "Nhập số điện thoại hoặc đường dẫn Zalo, ví dụ https://zalo.me/0900000000.",
  facebook: "Ví dụ https://m.me/tenpagefacebook.",
  message: "Ví dụ sms:0900000000 hoặc đường dẫn ứng dụng nhắn tin.",
  chatbot: "Nhập đường dẫn đến dịch vụ chatbot.",
  custom: "Ví dụ /lien-he hoặc https://example.com.",
};

export function QuickContactFields({
  editing, defaultSortOrder, hotline, canEditSettings,
}: {
  editing: QuickContact | null | undefined;
  defaultSortOrder: number;
  hotline: string | null;
  canEditSettings: boolean;
}) {
  const [type, setType] = useState(editing?.type ?? "");
  const isHotline = type === "hotline";
  const linkHint = TYPE_HINTS[type];

  return (
    <AdminSaveForm
      action={upsertQuickContactAction}
      unknownResultMessage="Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và danh sách nút liên hệ trước khi thử lại."
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div>
        <label htmlFor="f-lien-he-nhanh-type" className="mb-1.5 block text-xs font-semibold text-ink-soft">Loại</label>
        <select
          id="f-lien-he-nhanh-type"
          name="type"
          required
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="" disabled>
            — Chọn loại —
          </option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {isHotline && (
        <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
          <p>{hotline ? <>Hotline đang dùng <strong>{hotline}</strong></> : "Chưa có số Hotline hợp lệ trong Cài đặt chung."}</p>
          {canEditSettings ? (
            <Link href="/admin/cai-dat#f-cai-dat-hotline" className="mt-2 inline-block font-semibold underline">Đổi số trong Cài đặt chung</Link>
          ) : (
            <p className="mt-2">Liên hệ người có quyền Cài đặt chung để đổi số.</p>
          )}
        </div>
      )}
      <fieldset hidden={isHotline} disabled={isHotline} className="min-w-0 space-y-5">
        <div>
          <label htmlFor="f-lien-he-nhanh-label" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên hiển thị</label>
          <input
            id="f-lien-he-nhanh-label"
            name="label"
            required
            defaultValue={editing?.label}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Gọi hotline tuyển sinh"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Tên tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "label", enName: "labelEn" }]} />
            <input
              aria-label="Label (English)"
              name="labelEn"
              defaultValue={editing?.labelEn ?? ""}
              placeholder="Label (English)"
              className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <div>
          <label htmlFor="f-lien-he-nhanh-href" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Link
          </label>
          <input
            id="f-lien-he-nhanh-href"
            name="href"
            required
            defaultValue={editing?.href}
            aria-describedby={linkHint ? "quick-contact-link-hint" : undefined}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder={type === "zalo" ? "VD: zalo.me/0900000000" : "VD: https://…"}
          />
          {linkHint && <p id="quick-contact-link-hint" className="mt-2 text-xs text-ink-soft">{linkHint}</p>}
        </div>
      </fieldset>
      <div>
        <label htmlFor="f-lien-he-nhanh-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
        <input
          id="f-lien-he-nhanh-sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={editing?.sortOrder ?? defaultSortOrder}
          className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <FormActions cancelHref="/admin/lien-he-nhanh" submitLabel={editing ? "Lưu thay đổi" : "Thêm nút liên hệ"} />
    </AdminSaveForm>
  );
}
