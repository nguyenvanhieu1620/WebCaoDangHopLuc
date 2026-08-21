"use client";

import Image from "next/image";
import { useActionState } from "react";
import { SITE } from "@/lib/constants";
import { loginAction, type LoginState } from "@/lib/actions/auth-actions";

/** Trang đăng nhập admin — cố ý KHÔNG dùng layout sidebar (đứng độc lập). */
export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg2">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/images/logo-icon.png"
            alt={SITE.fullName}
            width={48}
            height={48}
            className="mb-3 h-12 w-auto"
          />
          <h1 className="font-display text-lg font-bold text-brand-900">
            Đăng nhập quản trị
          </h1>
          <p className="mt-1 text-xs text-ink-faint">
            {SITE.fullName} — CMS Admin
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Tài khoản
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="admin@hopluc.edu.vn"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="••••••••"
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
            {pending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <p className="text-center text-[11px] text-ink-faint">
            Tài khoản demo: admin@hopluc.edu.vn / HopLuc@2026
          </p>
        </form>
      </div>
    </div>
  );
}
