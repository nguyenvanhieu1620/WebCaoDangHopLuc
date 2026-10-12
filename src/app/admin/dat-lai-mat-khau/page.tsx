"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { SITE } from "@/lib/constants";
import { resetPasswordAction, type ResetPasswordState } from "@/lib/actions/password-reset-actions";

/** Trang đặt mật khẩu mới — mở từ link trong email "Quên mật khẩu", có kèm ?token=... */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    {}
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg2">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/images/logo.png"
            alt={SITE.fullName}
            width={1137}
            height={315}
            className="mb-4 h-14 w-auto"
          />
          <h1 className="font-display text-lg font-bold text-brand-900">Đặt mật khẩu mới</h1>
        </div>

        {!token ? (
          <p className="rounded-lg bg-accent-100 px-4 py-3 text-center text-[13px] font-semibold text-accent-700">
            Liên kết không hợp lệ — thiếu token. Yêu cầu gửi lại liên kết mới ở trang &quot;Quên mật khẩu&quot;.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Mật khẩu mới</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
            {state.error && (
              <p className="rounded-lg bg-accent-100 px-3 py-2 text-xs font-semibold text-accent-700">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-3 text-sm font-bold text-white shadow-red disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "Đặt mật khẩu mới"}
            </button>
          </form>
        )}

        <Link
          href="/admin/dang-nhap"
          className="mt-5 block text-center text-[12.5px] font-semibold text-brand-700 hover:text-accent-600"
        >
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
