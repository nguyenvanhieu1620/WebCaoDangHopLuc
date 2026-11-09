/**
 * Kích thước ảnh khuyến nghị cho từng LOẠI ô ảnh trong admin — đo từ khung hiển thị thật
 * ở web công khai (x2 cho màn hình nét cao/retina). `ImagePicker` dùng bảng này để hiện
 * gợi ý dưới ô chọn ảnh và cảnh báo khi ảnh nhỏ hơn / sai hướng. Đổi bố cục khung ảnh ở
 * web công khai thì cập nhật lại đúng mục ở đây.
 *
 * Web tự thu nhỏ ảnh to (next/image) nên ảnh lớn hơn khuyến nghị không sao; ảnh NHỎ hơn
 * thì bị kéo giãn → mờ. Máy tính: khung phủ kín (cắt phần thừa) nên chủ thể nên ở giữa ảnh.
 * Điện thoại: thẻ dùng FitImage thu vừa để hiện trọn ảnh; banner Trang chủ vẫn phủ kín khung
 * và có thể cắt ảnh. Một ảnh dùng ở nhiều vị trí thì phải ghi rõ các khung trong `where`/`tip`.
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
    shape: "landscape", ratio: "Thay đổi theo cửa sổ PC", minWidth: 1920, minHeight: 910, ideal: "Ngang 2560px; chiều cao theo khung",
    where: "Đầu Trang chủ, rộng hết màn hình; tiêu đề và nút nằm bên dưới. Khung PC thay đổi theo cả chiều rộng và chiều cao cửa sổ; điện thoại là 16:9.",
    tip: "Kích thước đã đo theo vùng nội dung web (không phải độ phân giải màn hình): cửa sổ 1280×720 → ảnh 2530×1200; 1920×900 → khoảng 2560×1048; 1920×1080 → khoảng 2560×1290. Không có một kích thước vừa khít mọi cửa sổ: ảnh phủ kín khung nên có thể bị cắt trên/dưới hoặc hai bên. Giữ chữ/chủ thể ở giữa, chừa nền quanh các mép; tránh phần trên bị menu đè và góc dưới phải có nút chuyển ảnh. Nên nén dưới ~1MB.",
  },
  pageBanner: {
    shape: "landscape", ratio: "3:1", minWidth: 1920, minHeight: 600, ideal: "2400×800",
    where: "Dải banner đầu trang con, rộng hết màn hình, cao 360–460px.",
    tip: "Máy tính: phủ kín dải banner (cắt bớt trên/dưới), bên trái phủ màu tối để đặt chữ → chủ thể ở giữa hoặc hơi lệch phải. Điện thoại: ảnh hiện trọn vẹn phía trên tiêu đề.",
  },
  cover: {
    shape: "landscape", ratio: "16:9 (ảnh dùng chung)", minWidth: 1200, minHeight: 675, ideal: "1920×1080",
    where: "Trang chủ: tin chính có khung thay đổi theo màn hình (PC cao tối thiểu 460px), tin phụ PC là 16:10. Ảnh còn dùng cho thẻ tin/sự kiện và banner trang chi tiết.",
    tip: "Không có một tỉ lệ vừa khít mọi vị trí: PC phủ kín khung nên có thể cắt mép; thẻ trên điện thoại hiện trọn ảnh. Giữ chủ thể ở giữa, chừa khoảng trống phía dưới cho tiêu đề tin chính. Ảnh rộng dưới 1920px có thể mờ khi làm nền banner.",
  },
  program: {
    shape: "landscape", ratio: "16:10 (thẻ Trang chủ)", minWidth: 1200, minHeight: 750, ideal: "1920×1200",
    where: "Đầu thẻ ngành trên Trang chủ cố định 16:10. Ảnh lớn trong trang chi tiết là 16:9; ảnh còn dùng ở danh sách ngành và nền banner.",
    tip: "Ảnh 1920×1200 đúng tỉ lệ thẻ Trang chủ; các vị trí khác trên PC có thể cắt mép trên/dưới. Thẻ trên điện thoại hiện trọn ảnh. Giữ chủ thể ở giữa, tránh đặt chữ quan trọng sát mép hoặc hai góc trên vì có nhãn mã ngành và thời gian học.",
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
