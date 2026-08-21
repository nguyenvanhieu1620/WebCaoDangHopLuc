import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import type { SiteSettings } from "@/lib/db/schema";

const QUICK_LINKS = [
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Ngành đào tạo", href: "/nganh-dao-tao" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Thư viện ảnh/video", href: "/thu-vien" },
  { label: "LMS VNPT", href: "/lms" },
];

const PROGRAM_LINKS = [
  { label: "Điều dưỡng", href: "/nganh-dao-tao/dieu-duong" },
  { label: "Dược", href: "/nganh-dao-tao/duoc" },
  { label: "Xét nghiệm Y học", href: "/nganh-dao-tao/xet-nghiem-y-hoc" },
  { label: "Hộ sinh", href: "/nganh-dao-tao/ho-sinh" },
  { label: "Phục hồi chức năng", href: "/nganh-dao-tao/phuc-hoi-chuc-nang" },
  { label: "Y sĩ đa khoa", href: "/nganh-dao-tao/y-si-da-khoa" },
];

const ADMISSION_LINKS = [
  { label: "Chỉ tiêu & điều kiện", href: "/tuyen-sinh" },
  { label: "Đăng ký xét tuyển", href: "/tuyen-sinh#dang-ky" },
  { label: "Tra cứu kết quả", href: "/tra-cuu-ket-qua" },
  { label: "Liên hệ tuyển sinh", href: "/lien-he" },
];

type SiteFooterProps = {
  settings: Pick<
    SiteSettings,
    "hotline" | "email" | "address" | "facebookUrl" | "zaloUrl" | "youtubeUrl"
  >;
};

/**
 * Footer dùng chung cho mọi trang công khai — 4 cột liên kết + thông tin
 * liên hệ. `settings` lấy từ DB ở layout cha, quản lý qua admin/cai-dat.
 */
export function SiteFooter({ settings }: SiteFooterProps) {
  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto max-w-[1320px] px-6 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/images/logo-icon.png"
                alt={SITE.fullName}
                width={38}
                height={38}
                className="h-9 w-auto"
              />
              <div className="leading-tight">
                <div className="font-display text-base font-bold">{SITE.name}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-white/60">
                  {SITE.tagline}
                </div>
              </div>
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-white/55">
              Đào tạo nguồn nhân lực y dược chất lượng cao, gắn lý thuyết với
              thực hành lâm sàng thực tế ngay từ năm nhất.
            </p>
            <div className="mt-5 flex gap-2.5">
              {(
                [
                  { label: "FB", href: settings.facebookUrl },
                  { label: "ZL", href: settings.zaloUrl },
                  { label: "YT", href: settings.youtubeUrl },
                ] as const
              ).map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Liên kết nhanh" links={QUICK_LINKS} />
          <FooterColumn title="Ngành đào tạo" links={PROGRAM_LINKS} />

          <div>
            <FooterColumn title="Tuyển sinh" links={ADMISSION_LINKS} />
            <div className="mt-6">
              <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-white/45">
                Liên hệ
              </div>
              <p className="text-[13.5px] leading-relaxed text-white/80">
                {settings.address}
                <br />
                Hotline: {settings.hotline}
                <br />
                {settings.email}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {SITE.fullName}. Bảo lưu mọi quyền.
          </span>
          <div className="flex gap-5">
            <Link href="/admin" className="hover:text-white">
              Quản trị
            </Link>
            <span>Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-white/45">
        {title}
      </div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-[13.5px] text-white/80 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
