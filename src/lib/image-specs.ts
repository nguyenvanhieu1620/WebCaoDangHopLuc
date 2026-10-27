/**
 * Kích thước ảnh khuyến nghị cho từng LOẠI ô ảnh trong admin — đo từ khung hiển thị thật
 * ở web công khai (x2 cho màn hình nét cao/retina). `ImagePicker` dùng bảng này để hiện
 * gợi ý dưới ô chọn ảnh và cảnh báo khi ảnh nhỏ hơn / sai hướng. Đổi bố cục khung ảnh ở
 * web công khai thì cập nhật lại đúng mục ở đây.
 *
 * Web tự thu nhỏ ảnh to (next/image) nên ảnh lớn hơn khuyến nghị không sao; ảnh NHỎ hơn
 * thì bị kéo giãn → mờ. Máy tính: khung phủ kín (cắt phần thừa) nên chủ thể nên ở giữa ảnh.
 * Điện thoại: banner + thẻ ảnh hiện TRỌN ảnh (FitImage / khối "ảnh trọn vẹn" của HeroBanner,
 * PageHero) — admin chỉ tải 1 ảnh cho cả 2.
 */

export type ImageSpecKey = "hero" | "pageBanner" | "cover" | "program" | "portrait" | "avatar" | "gallery" | "logo" | "milestone";

export type ImageSpec = {
  /** Hướng khung hiển thị — ảnh ngược hướng sẽ bị cắt nhiều. */
  shape: "landscape" | "portrait";
  /** Tỉ lệ khuyến nghị để hiện trong gợi ý ("" = không áp tỉ lệ, VD logo). */
  ratio: string;
  /** Dưới mức này ảnh bắt đầu mờ thấy rõ (px) → cảnh báo. `minWidth: 0` = chỉ xét chiều cao (logo). */
  minWidth: number;
  minHeight: number;
  /** Kích thước đẹp nhất. */
  ideal: string;
  /** Ảnh hiện ở đâu, khung ra sao. */
  where: string;
  /** Mẹo bố cục/cắt ảnh. */
  tip: string;
  /** Cần nền trong suốt (logo) — cảnh báo khi chọn JPG. */
  transparent?: boolean;
};

export const IMAGE_SPECS: Record<ImageSpecKey, ImageSpec> = {
  hero: {
    shape: "landscape", ratio: "≈2,11:1 (desktop đã đo)", minWidth: 1920, minHeight: 910, ideal: "2530×1200 (khung desktop 1265×600)",
    where: "Đầu Trang chủ, rộng hết màn hình; tiêu đề và nút nằm bên dưới. Khung desktop thay đổi theo màn hình, khung điện thoại là 16:9.",
    tip: "Tại cửa sổ desktop 1280×720, khung banner là 1265×600: dùng ảnh 2530×1200 hoặc gần tương đương 2560×1214. 2560×1440 cao hơn tỉ lệ khung này nên bị cắt trên/dưới. Đây không phải kích thước vừa khít mọi thiết bị: trên điện thoại, ảnh ngang theo tỉ lệ desktop có thể bị cắt hai bên. Giữ chữ/chủ thể quan trọng ở giữa, chừa mép trên cho thanh menu và góc dưới cho nút chuyển ảnh. Nên nén dưới ~1MB.",
  },
  pageBanner: {
    shape: "landscape", ratio: "3:1", minWidth: 1920, minHeight: 600, ideal: "2400×800",
    where: "Dải banner đầu trang con, rộng hết màn hình, cao 360–460px.",
    tip: "Máy tính: phủ kín dải banner (cắt bớt trên/dưới), bên trái phủ màu tối để đặt chữ → chủ thể ở giữa hoặc hơi lệch phải. Điện thoại: ảnh hiện trọn vẹn phía trên tiêu đề.",
  },
  cover: {
    shape: "landscape", ratio: "16:9", minWidth: 1200, minHeight: 675, ideal: "1920×1080",
    where: "Thẻ tin/sự kiện (máy tính cắt còn khoảng 2:1, điện thoại hiện trọn ảnh) và làm nền banner trang chi tiết.",
    tip: "Chủ thể ở giữa, chừa khoảng trống xung quanh. Ảnh rộng dưới 1920px sẽ hơi mờ khi làm nền banner.",
  },
  program: {
    shape: "landscape", ratio: "16:9 hoặc 3:2", minWidth: 1200, minHeight: 800, ideal: "1920×1080",
    where: "Đầu thẻ ngành (máy tính cắt còn khoảng 2,3:1, điện thoại hiện trọn ảnh), ảnh lớn 16:9 ở trang chi tiết ngành và nền banner.",
    tip: "Chủ thể ở giữa — trên máy tính thẻ cắt bớt mép trên/dưới.",
  },
  portrait: {
    shape: "portrait", ratio: "3:4", minWidth: 600, minHeight: 800, ideal: "900×1200",
    where: "Khung vòm dọc 4:5 ở thẻ giảng viên, khối đội ngũ Trang chủ (người đầu danh sách hiện lớn) và đầu trang hồ sơ — giữ phần trên ảnh.",
    tip: "Ảnh chân dung dọc, mặt ở 1/3 phía trên, chừa khoảng trống trên đầu (đỉnh vòm bo tròn). Ảnh thẻ nền trắng dùng tốt — khung có phông xanh nhạt nên nền trắng trông như phông chụp.",
  },
  avatar: {
    shape: "portrait", ratio: "3:4", minWidth: 620, minHeight: 800, ideal: "900×1200",
    where: "Khung vòm dọc ở khối Câu chuyện thành công (giữ phần trên ảnh).",
    tip: "Ảnh chân dung dọc, mặt nằm ở 1/3 phía trên.",
  },
  gallery: {
    shape: "landscape", ratio: "3:2 hoặc 16:9", minWidth: 1200, minHeight: 800, ideal: "1920×1280",
    where: "Ô lưới Thư viện (máy tính cắt còn khoảng 2:1, điện thoại hiện trọn ảnh; ảnh vị trí đầu là ô to nhất); bấm vào xem nguyên ảnh.",
    tip: "Chủ thể ở giữa ảnh.",
  },
  logo: {
    shape: "landscape", ratio: "", minWidth: 0, minHeight: 120, ideal: "≥ 400×120",
    where: "Ô 132×36 ở dải đối tác Trang chủ — thu vừa, không cắt, hiện màu xám (rê chuột hiện màu).",
    tip: "PNG nền trong suốt, logo nằm ngang, cắt sát mép logo (không chừa lề trắng).",
    transparent: true,
  },
  milestone: {
    shape: "landscape", ratio: "2:1", minWidth: 1200, minHeight: 600, ideal: "1600×800",
    where: "Ảnh minh hoạ cột mốc ở trang Giới thiệu (khung khoảng 400×180).",
    tip: "Chủ thể ở giữa ảnh.",
  },
};

export type ImageNotice = { level: "ok" | "warn"; text: string };

/** Đánh giá 1 ảnh theo loại ô — trả về danh sách cảnh báo (rỗng = đạt) để hiện dưới ô chọn ảnh. */
export function assessImage(spec: ImageSpec, width: number, height: number, isJpeg = false): ImageNotice[] {
  const notices: ImageNotice[] = [];
  const size = `${width}×${height}`;
  if (width < spec.minWidth || height < spec.minHeight) {
    const min = spec.minWidth ? `${spec.minWidth}×${spec.minHeight}` : `cao ${spec.minHeight}px`;
    notices.push({ level: "warn", text: `Ảnh ${size} nhỏ hơn khuyến nghị (tối thiểu ${min}) — sẽ bị kéo giãn, trông mờ trên web.` });
  }
  if (spec.shape === "landscape" && height >= width) {
    notices.push({
      level: "warn",
      text: spec.transparent
        ? "Logo vuông/dọc sẽ hiện rất nhỏ trong ô nằm ngang — nên dùng bản logo ngang."
        : "Ảnh dọc/vuông — khung hiển thị nằm ngang nên sẽ bị cắt mất nhiều phần trên và dưới.",
    });
  }
  if (spec.shape === "portrait" && width > height) {
    notices.push({ level: "warn", text: "Ảnh ngang — khung chân dung dọc nên 2 bên sẽ bị cắt, chỉ giữ phần giữa." });
  }
  if (spec.transparent && isJpeg) {
    notices.push({ level: "warn", text: "JPG không có nền trong suốt — nền của logo sẽ hiện thành 1 khối màu. Nên dùng PNG." });
  }
  return notices.length ? notices : [{ level: "ok", text: `Ảnh ${size} — đạt khuyến nghị.` }];
}

/**
 * `sizes` cho các lớp ảnh banner chỉ hiện ở 1 khổ màn hình (ảnh phủ kín `hidden lg:block` trên máy
 * tính; nền mờ + ảnh trọn khung `lg:hidden` trên điện thoại). Khai báo "100vw" cho cả 2 thì lớp đang
 * bị ẩn (rộng 0px) vẫn chọn ảnh lớn nhất và Next báo cảnh báo "not rendered at full viewport width".
 * Các lớp cùng khổ dùng chung 1 hằng số → cùng ảnh → trình duyệt chỉ tải 1 lần; lớp bị ẩn chỉ tải
 * bản nhỏ nhất (vài KB) nếu là ảnh ưu tiên.
 */
export const SIZES_DESKTOP_ONLY = "(min-width: 1024px) 100vw, 1px";
export const SIZES_MOBILE_ONLY = "(min-width: 1024px) 1px, 100vw";
