import Image from "next/image";
import { cn } from "@/lib/utils";

/** Chữ cái đầu của tên gọi (từ cuối của họ tên) — hiện thay ảnh khi giảng viên chưa có ảnh. */
export function nameInitial(name: string): string {
  return name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";
}

type FacultyPortraitProps = {
  photoUrl: string | null;
  name: string;
  sizes: string;
  priority?: boolean;
  /** Kích thước/tỉ lệ khung + bo góc dưới + viền (VD "aspect-[4/5] rounded-b-[16px] ring-1 ring-white/20"). */
  className?: string;
  imageClassName?: string;
  /** Cỡ chữ cái đầu khi chưa có ảnh (mặc định text-[64px]). */
  initialClassName?: string;
};

/**
 * Ảnh chân dung khung vòm — dùng chung cho thẻ giảng viên, khối đội ngũ ở Trang chủ và trang hồ sơ.
 * Ảnh trường gửi thường là ẢNH THẺ NỀN TRẮNG: khung vòm có phông sáng xanh nhạt nên nền trắng trông như
 * phông chụp có chủ đích, không "dán" lên nền tối. Khung gần tỉ lệ ảnh dọc 3:4 nên không cắt mất mặt
 * (giữ phần trên ảnh). Chưa có ảnh → chữ cái đầu tên trên nền xanh.
 */
export function FacultyPortrait({ photoUrl, name, sizes, priority, className, imageClassName, initialClassName }: FacultyPortraitProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-t-[999px] bg-gradient-to-b from-brand-100 to-white", className)}>
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={sizes} priority={priority} className={cn("object-cover object-top", imageClassName)} />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900">
          <span className={cn("font-display font-semibold text-white/90", initialClassName ?? "text-[64px]")}>{nameInitial(name)}</span>
        </div>
      )}
    </div>
  );
}
