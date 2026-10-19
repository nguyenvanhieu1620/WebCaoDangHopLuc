"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { SITE } from "@/lib/constants";
import { requestPasswordResetAction, type RequestResetState } from "@/lib/actions/password-reset-actions";

/** Trang "Quên mật khẩu" — nhập email, gửi link đặt lại qua email nếu tài khoản tồn tại. */
export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<RequestResetState, FormData>(
    requestPasswordResetAction,
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
          <h1 className="font-display text-lg font-bold text-brand-900">Quên mật khẩu</h1>
          <p className="mt-1 text-xs text-ink-faint">
            Nhập email tài khoản quản trị để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {state.message ? (
          <div className="rounded-lg bg-brand-50 px-4 py-3 text-center text-[13px] font-semibold text-brand-700">
            {state.message}
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="f-quen-mat-khau-email" className="mb-1.5 block text-xs font-semibold text-ink-soft">Email</label>
              <input
                id="f-quen-mat-khau-email"
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="admin@hopluc.edu.vn"
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
              {pending ? "Đang gửi..." : "Gửi liên kết đặt lại"}
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
