"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SITE } from "@/lib/constants";
import { loginAction, type LoginState } from "@/lib/actions/auth-actions";

/** Trang đăng nhập admin — cố ý KHÔNG dùng layout sidebar (đứng độc lập). */
export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const justReset = searchParams.get("reset") === "1";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );
  // Email là controlled input: React 19 tự reset field không kiểm soát sau
  // mỗi lần form action chạy xong, nên nhập sai mật khẩu sẽ mất email đã gõ.
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          {justReset && (
            <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
              ✓ Đặt mật khẩu mới thành công — đăng nhập lại bên dưới.
            </p>
          )}
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Tài khoản
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? "login-error" : undefined}
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="admin@hopluc.edu.vn"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-semibold text-ink-soft">
                Mật khẩu
              </label>
              <Link href="/admin/quen-mat-khau" className="text-[11px] font-semibold text-brand-700 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                aria-invalid={state.error ? true : undefined}
                aria-describedby={state.error ? "login-error" : undefined}
                className="w-full rounded-lg border border-line py-2.5 pl-3.5 pr-16 text-sm outline-none focus:border-brand-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-controls="login-password"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute inset-y-1 right-1 rounded-md px-2.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>
          {state.error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-lg bg-accent-100 px-3 py-2 text-xs font-semibold text-accent-700"
            >
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
