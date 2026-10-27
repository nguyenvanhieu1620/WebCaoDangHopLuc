import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { TiltCard } from "@/components/site/TiltCard";
import { FacultyPortrait } from "@/components/site/FacultyPortrait";
import { cn } from "@/lib/utils";

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
  glass: "bg-white/[0.06] ring-white/15 hover:bg-white/[0.1]",
};

/**
 * Thẻ giảng viên chung (phong cách "thanh lịch nền xanh đậm"): ảnh chân dung khung vòm, chức vụ chữ đỏ in
 * hoa, tên trắng, khoa/chuyên môn, dòng "Xem hồ sơ →" ở đáy. Dùng ở /doi-ngu-giang-vien (FacultyDirectory) và
 * khối đội ngũ Trang chủ. Không có hook → dùng được trong cả Server lẫn Client Component.
 */
export function FacultyCard({ data, tone = "solid", delay = 0, className, sizes }: FacultyCardProps) {
  const { href, name, role, department, specialty, photoUrl } = data;
  const body = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/25 opacity-60 blur-[60px] transition-opacity duration-500 group-hover:opacity-100"
      />
      <FacultyPortrait
        photoUrl={photoUrl}
        name={name}
        sizes={sizes ?? "(max-width: 640px) 48vw, (max-width: 1024px) 45vw, 300px"}
        className="img-shine aspect-[4/5] rounded-b-[16px] ring-1 ring-white/20"
        imageClassName="transition-transform duration-700 group-hover:scale-[1.04]"
      />
      {/* Cỡ chữ nhỏ hơn dưới sm: trang danh sách xếp 2 thẻ/hàng trên điện thoại (thẻ ~160px). */}
      <div className="relative flex flex-1 flex-col px-1 pb-1 pt-4 sm:px-2 sm:pt-5">
        <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-accent-400 sm:text-[10.5px] sm:tracking-[0.16em]">{role}</div>
        <h3 className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-white sm:mt-2 sm:text-[17px]">{name}</h3>
        {department && <div className="mt-1 text-[12px] text-brand-200 sm:text-[12.5px]">{department}</div>}
        {specialty && <p className="mt-2 line-clamp-2 hidden text-[12.5px] leading-relaxed text-white/60 sm:block">{specialty}</p>}
        {href && (
          <div className="mt-auto pt-4 sm:pt-5">
            <span className="flex items-center justify-between border-t border-white/10 pt-3 text-[10.5px] font-bold uppercase tracking-[0.12em] sm:pt-3.5 sm:text-[11.5px] sm:tracking-[0.14em] text-white/60 transition-colors group-hover:text-white">
              Xem hồ sơ
              <span aria-hidden="true" className="text-accent-400 transition-transform duration-300 group-hover:translate-x-1">
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
      <TiltCard className="h-full rounded-[18px] sm:rounded-[22px]">
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
export function FacultySpotlight({ data }: { data: FacultyCardData }) {
  const { href, name, role, department, photoUrl } = data;
  const inner = (
    <>
      <FacultyPortrait
        photoUrl={photoUrl}
        name={name}
        sizes="(max-width: 1024px) 85vw, 440px"
        className="img-shine aspect-[4/5] rounded-b-[28px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/25"
        imageClassName="transition-transform duration-700 group-hover:scale-[1.03]"
        initialClassName="text-[120px]"
      />
      {/* Kính mờ chỉ từ lg: điện thoại backdrop-blur trên ảnh lớn tốn GPU khi cuộn (xem CLAUDE.md mục DnaScene3D). */}
      <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-brand-900/90 p-5 ring-1 ring-white/15 sm:inset-x-5 sm:bottom-5 sm:p-6 lg:bg-brand-900/80 lg:backdrop-blur-md">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-400">{role}</div>
        <h3 className="mt-2 font-display text-[22px] font-semibold leading-tight text-white sm:text-[26px]">{name}</h3>
        {department && <div className="mt-1 text-[13px] text-brand-200">{department}</div>}
        {href && (
          <span className="mt-4 inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors group-hover:text-white">
            Xem hồ sơ
            <span aria-hidden="true" className="text-accent-400 transition-transform duration-300 group-hover:translate-x-1">
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
        <Link href={href} className="group relative block">
          {inner}
        </Link>
      ) : (
        <div className="group relative">{inner}</div>
      )}
    </div>
  );
}
