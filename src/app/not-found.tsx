import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * 404 gốc — Next.js dùng file này khi URL không khớp BẤT KỲ route nào
 * trong toàn app (kể cả ngoài "(site)", VD gõ nhầm địa chỉ). Cố ý đứng độc
 * lập, không gọi data layer/DB — trang lỗi phải luôn hiển thị được kể cả
 * khi có sự cố khác ở tầng dữ liệu.
 */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <Image
        src="/images/logo.png"
        alt={SITE.fullName}
        width={1137}
        height={315}
        className="mb-6 h-14 w-auto"
      />
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-600">
        404
      </div>
      <h1 className="mt-3 font-display text-[28px] font-semibold leading-tight text-brand-900">
        Không tìm thấy trang này
      </h1>
      <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-ink-soft">
        Đường dẫn bạn nhập không tồn tại — kiểm tra lại địa chỉ hoặc quay về
        trang chủ.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 px-6 py-3.5 text-sm font-bold text-white shadow-red transition-all duration-200 hover:-translate-y-0.5"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
