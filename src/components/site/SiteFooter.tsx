import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import { NewsletterForm } from "./NewsletterForm";
import { SOCIAL_BG, SocialIcon, socialLinks } from "@/components/ui/SocialIcon";
import { cn } from "@/lib/utils";
import type { Program, SiteSettings } from "@/lib/db/schema";
import type { Locale } from "@/lib/locale";

const QUICK_LINKS = [
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Ngành đào tạo", href: "/nganh-dao-tao" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Thư viện ảnh/video", href: "/thu-vien" },
  { label: "LMS VNPT", href: "/lms" },
];

const ADMISSION_LINKS = [
  { label: "Chỉ tiêu & điều kiện", href: "/tuyen-sinh" },
  { label: "Đăng ký xét tuyển", href: "/tuyen-sinh#dang-ky" },
  { label: "Tra cứu kết quả", href: "/tra-cuu-ket-qua" },
  { label: "Liên hệ tuyển sinh", href: "/lien-he" },
];

type SiteFooterProps = {
  locale?: Locale;
  settings: Pick<
    SiteSettings,
    "hotline" | "email" | "address" | "facebookUrl" | "zaloUrl" | "youtubeUrl"
  >;
  /** Danh sách ngành đào tạo thật từ DB — không hard-code, admin thêm/sửa/xoá ở admin/nganh-dao-tao là cập nhật ngay. */
  programs: Pick<Program, "slug" | "name">[];
};

/**
 * Footer dùng chung cho mọi trang công khai — 4 cột liên kết + thông tin
 * liên hệ. `settings` lấy từ DB ở layout cha, quản lý qua admin/cai-dat.
 */
export function SiteFooter({ settings, programs, locale = "vi" }: SiteFooterProps) {
  const en = locale === "en";
  const quickLinks = QUICK_LINKS.map((link, i) => ({ ...link, label: en ? ["About", "Programs", "News", "Photo & video library", "VNPT LMS"][i] : link.label }));
  const admissionLinks = ADMISSION_LINKS.map((link, i) => ({ ...link, label: en ? ["Intake & eligibility", "Apply for admission", "Application status", "Contact admissions"][i] : link.label }));
  const programLinks = programs
    .slice(0, 6)
    .map((p) => ({ label: p.name, href: `/nganh-dao-tao/${p.slug}` }));
  const socials = socialLinks(settings);

  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto max-w-[1320px] px-6 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            {/* Logo đúng màu gốc trên ô trắng — footer nền xanh đậm (xem ghi chú ở SiteHeader). */}
            <div className="mb-5 inline-flex rounded-xl bg-white px-4 py-2.5">
              <Image
                src="/images/logo.png"
                alt={SITE.fullName}
                width={1137}
                height={315}
                sizes="200px"
                className="h-12 w-auto"
              />
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-white/55">
              {en ? "Healthcare education connecting theory with clinical practice from the first year." : "Đào tạo nguồn nhân lực y dược chất lượng cao, gắn lý thuyết với thực hành lâm sàng thực tế ngay từ năm nhất."}
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.network}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} ${en ? "of" : "của"} ${SITE.fullName}`}
                    title={s.label}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_rgba(0,0,0,0.25)] ring-1 ring-white/15 transition duration-200 hover:-translate-y-0.5 hover:ring-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                      SOCIAL_BG[s.network]
                    )}
                  >
                    <SocialIcon network={s.network} size={s.network === "youtube" ? 22 : 20} />
                  </a>
                ))}
              </div>
            )}
            <div className="mt-6 max-w-xs">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-white/45">
                {en ? "Newsletter" : "Đăng ký nhận tin"}
              </div>
              <NewsletterForm locale={locale} />
            </div>
          </div>

          <FooterColumn title={en ? "Quick links" : "Liên kết nhanh"} links={quickLinks} />
          <FooterColumn title={en ? "Programs" : "Ngành đào tạo"} links={programLinks} />

          <div>
            <FooterColumn title={en ? "Admissions" : "Tuyển sinh"} links={admissionLinks} />
            <div className="mt-6">
              <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-white/45">
                {en ? "Contact" : "Liên hệ"}
              </div>
              <p className="break-words text-[13.5px] leading-relaxed text-white/80 [overflow-wrap:anywhere]">
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
            © {new Date().getFullYear()} {SITE.fullName}. {en ? "All rights reserved." : "Bảo lưu mọi quyền."}
          </span>
          <div className="flex gap-5">
            {/* Đổi tài liệu khi vào admin để không mang theo script Analytics của trang công khai. */}
            <a href="/admin" className="hover:text-white">
              {en ? "Administration" : "Quản trị"}
            </a>
            <Link href="/chinh-sach-bao-mat" className="hover:text-white">
              {en ? "Privacy policy" : "Chính sách bảo mật"}
            </Link>
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
