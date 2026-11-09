import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { TiltCard } from "@/components/site/TiltCard";
import { FacultyPortrait } from "@/components/site/FacultyPortrait";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { siteCopy } from "@/lib/site-copy";

export type FacultyCardData = {
  /** Link trang hồ sơ (null = chưa có slug, thẻ không bấm được). */
  href: string | null;
  /** Tên hiển thị đã ghép học hàm/học vị — facultyDisplayName(). */
  name: string;
  role: string;
  department?: string | null;
  specialty?: string | null;
  photoUrl: string | null;
};

type FacultyCardProps = {
  locale?: Locale;
  data: FacultyCardData;
  /** "solid": thẻ xanh đậm trên nền sáng (trang danh sách). "glass": thẻ trong mờ trên khối nền xanh đậm (Trang chủ). */
  tone?: "solid" | "glass";
  delay?: number;
  /** Class cho lớp Reveal ngoài cùng (VD bề rộng thẻ trong dải vuốt ngang trên điện thoại). */
  className?: string;
  sizes?: string;
};

const BOX: Record<NonNullable<FacultyCardProps["tone"]>, string> = {
  solid:
    "bg-gradient-to-b from-brand-800 to-brand-900 shadow-[0_24px_50px_-26px_rgba(6,50,90,0.75)] ring-white/10 hover:shadow-[0_32px_60px_-24px_rgba(6,50,90,0.85)]",
  glass: "bg-white/[0.05] ring-white/15 hover:bg-white/[0.08] hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
};

/**
 * Thẻ giảng viên chung (phong cách "thanh lịch nền xanh đậm"): ảnh chân dung khung vòm, chức vụ chữ đỏ in
 * hoa, tên trắng, khoa/chuyên môn, dòng "Xem hồ sơ →" ở đáy. Dùng ở /doi-ngu-giang-vien (FacultyDirectory) và
 * khối đội ngũ Trang chủ. Không có hook → dùng được trong cả Server lẫn Client Component.
 */
export function FacultyCard({ data, tone = "solid", delay = 0, className, sizes, locale = "vi" }: FacultyCardProps) {
  const t = siteCopy(locale);
  const { href, name, role, department, specialty, photoUrl } = data;
  const onHomepage = tone === "glass";
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[60px] transition-opacity duration-500",
          onHomepage ? "bg-brand-500/10 opacity-40 group-hover:opacity-60" : "bg-brand-500/25 opacity-60 group-hover:opacity-100"
        )}
      />
      <FacultyPortrait
        photoUrl={photoUrl}
        name={name}
        sizes={sizes ?? "(max-width: 640px) 48vw, (max-width: 1024px) 45vw, 300px"}
        className={cn("aspect-[4/5] rounded-b-[16px] ring-1 ring-white/20", !onHomepage && "img-shine")}
        imageClassName={onHomepage ? "motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.015] motion-safe:group-focus-visible:scale-[1.015]" : "transition-transform duration-700 group-hover:scale-[1.04]"}
      />
      {/* Trang chủ chừa hai dòng cho chức danh/tên để căn đều; danh sách giữ cỡ chữ cho lưới 2 cột mobile. */}
      <div className={cn("relative flex flex-1 flex-col px-1 pb-1 sm:px-2", onHomepage ? "pt-5 sm:pt-6" : "pt-4 sm:pt-5")}>
        <div className={cn(
          "font-bold uppercase text-accent-400",
          onHomepage ? "min-h-[2.8em] break-words text-[10.5px] leading-[1.4] tracking-[0.1em] sm:text-[11px]" : "text-[9.5px] tracking-[0.12em] sm:text-[10.5px] sm:tracking-[0.16em]"
        )}>{role}</div>
        <h3 className={cn(
          "font-display font-semibold text-white",
          onHomepage ? "mt-2 min-h-[2.6em] break-words text-[17px] leading-[1.3] sm:text-[18px]" : "mt-1.5 text-[15px] leading-snug sm:mt-2 sm:text-[17px]"
        )}>{name}</h3>
        {department && <div className="mt-1 text-[12px] text-brand-200 sm:text-[12.5px]">{department}</div>}
        {specialty && <p className="mt-2 line-clamp-2 hidden text-[12.5px] leading-relaxed text-white/60 sm:block">{specialty}</p>}
        {href && (
          <div className="mt-auto pt-4 sm:pt-5">
            <span className={cn(
              "flex items-center justify-between border-t border-white/10 font-bold uppercase transition-colors group-hover:text-white",
              onHomepage ? "min-h-11 gap-3 pt-3 text-[11px] tracking-[0.1em] text-white/80 group-focus-visible:text-white" : "pt-3 text-[10.5px] tracking-[0.12em] sm:pt-3.5 sm:text-[11.5px] sm:tracking-[0.14em] text-white/60"
            )}>
              {t.profile}
              <span aria-hidden="true" className={cn("text-accent-400", onHomepage ? "motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" : "transition-transform duration-300 group-hover:translate-x-1")}>
                →
              </span>
            </span>
          </div>
        )}
      </div>
    </>
  );
  const box = cn(
    "group relative isolate flex h-full flex-col overflow-clip rounded-[18px] p-2.5 text-white sm:rounded-[22px] sm:p-3 ring-1 transition-[box-shadow,background-color] duration-300",
    BOX[tone]
  );
  return (
    <Reveal delay={delay} className={className}>
      <TiltCard max={onHomepage ? 2 : 7} className={cn("h-full rounded-[18px] sm:rounded-[22px]", onHomepage && "[&>.tilt-glare]:hidden")}>
        {href ? (
          <Link href={href} className={box}>
            {body}
          </Link>
        ) : (
          <div className={box}>{body}</div>
        )}
      </TiltCard>
    </Reveal>
  );
}

/**
 * Chân dung lớn của người đứng đầu danh sách (thường là Hiệu trưởng) ở khối đội ngũ Trang chủ: khung vòm
 * cao, vòm viền mảnh lệch phía sau tạo chiều sâu, thẻ tên nền xanh đậm đè mép dưới ảnh.
 */
export function FacultySpotlight({ data, locale = "vi" }: { data: FacultyCardData; locale?: Locale }) {
  const t = siteCopy(locale);
  const { href, name, role, department, photoUrl } = data;
  const inner = (
    <>
      <FacultyPortrait
        photoUrl={photoUrl}
        name={name}
        sizes="(max-width: 1024px) 85vw, 440px"
        className="aspect-[4/5] rounded-b-[28px] shadow-[0_24px_64px_-30px_rgba(0,0,0,0.45)] ring-1 ring-white/25"
        imageClassName="motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.015] motion-safe:group-focus-visible:scale-[1.015]"
        initialClassName="text-[120px]"
      />
      {/* Kính mờ chỉ từ lg: điện thoại backdrop-blur trên ảnh lớn tốn GPU khi cuộn (xem CLAUDE.md mục DnaScene3D). */}
      <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-brand-900/95 p-4 ring-1 ring-white/15 sm:inset-x-5 sm:bottom-5 sm:p-6 lg:bg-brand-900/90 lg:backdrop-blur-md">
        <div className="break-words text-[10.5px] font-bold uppercase leading-relaxed tracking-[0.12em] text-accent-400 sm:text-[11px]">{role}</div>
        <h3 className="mt-2 break-words font-display text-[20px] font-semibold leading-[1.3] text-white sm:text-[24px]">{name}</h3>
        {department && <div className="mt-2 text-[13px] leading-relaxed text-brand-200">{department}</div>}
        {href && (
          <span className="mt-4 flex min-h-11 items-center justify-between gap-3 border-t border-white/10 pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white/80 transition-colors group-hover:text-white group-focus-visible:text-white sm:text-[11.5px]">
            {t.profile}
            <span aria-hidden="true" className="text-accent-400 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1">
              →
            </span>
          </span>
        )}
      </div>
    </>
  );
  return (
    <div className="relative mx-auto w-full max-w-[440px] xl:mx-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-4 translate-y-4 rounded-b-[28px] rounded-t-[999px] border border-white/15 sm:translate-x-6 sm:translate-y-6"
      />
      {href ? (
        <Link href={href} className="group relative block rounded-b-[28px] rounded-t-[999px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-900">
          {inner}
        </Link>
      ) : (
        <div className="group relative">{inner}</div>
      )}
    </div>
  );
}
