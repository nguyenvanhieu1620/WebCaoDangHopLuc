import type { Locale } from "@/lib/locale";

// Chữ giao diện dùng chung cho Server/Client Component; nội dung CMS vẫn qua data layer.
const vi = {
  apply: "Đăng ký xét tuyển", applyNow: "Đăng ký xét tuyển ngay", explorePrograms: "Khám phá ngành học",
  onlineApplication: "Nộp hồ sơ trực tuyến", results: "Tra cứu kết quả", admissionResults: "Xem kết quả xét tuyển",
  library: "Thư viện", libraryDescription: "Ảnh & tư liệu nhà trường", lms: "Cổng học tập LMS", lmsDescription: "Học liệu điện tử VNPT",
  mission: "Sứ mệnh", vision: "Tầm nhìn", facultyStaff: "Giảng viên & cán bộ", departments: "Khoa / phòng ban", postgraduate: "Trình độ sau đại học",
  why: "Vì sao chọn Hợp Lực", whyTitle: "Đào tạo thực chiến,", whyEmphasis: "đồng hành", whyEnding: "đến khi có việc làm",
  rotateModel: "Di chuột để xoay mô hình", news: "Tin tức & sự kiện", newsTitle: "Hợp Lực hôm nay", allNews: "Xem tất cả tin",
  postImage: "Ảnh bài viết", featuredNews: "Tin nổi bật", readMore: "Đọc tiếp", notices: "Thông báo", attachment: "Tệp đính kèm",
  upcomingEvents: "Sự kiện sắp diễn ra", calendar: "Lịch", programs: "Ngành đào tạo", allPrograms: "Xem tất cả ngành",
  programsDescription: "Chương trình gắn chặt thực hành lâm sàng tại bệnh viện đối tác ngay từ năm nhất.", programList: "Danh sách ngành đào tạo",
  faculty: "Đội ngũ giảng viên", facultyTitle: "Giảng viên giàu kinh nghiệm lâm sàng", allFaculty: "Xem toàn bộ đội ngũ",
  studentLife: "Đời sống sinh viên", experience: "Trải nghiệm Hợp Lực", viewLibrary: "Xem thư viện",
  viewVideo: "Xem video", viewImage: "Xem ảnh", clinicalPractice: "Thực hành lâm sàng", laboratory: "Phòng thí nghiệm",
  graduation: "Lễ tốt nghiệp", extracurricular: "Hoạt động ngoại khoá", campus: "Khuôn viên trường",
  partners: "Đối tác", trainingPartners: "Đối tác đào tạo", partnersTitle: "Đối tác đào tạo & thực hành lâm sàng", admissions: "Tuyển sinh",
  disclosures: "Công khai theo quy định", disclosuresDescription: "Tài chính, cơ sở vật chất, chương trình đào tạo, đội ngũ giảng viên",
  details: "Chi tiết", viewDetails: "Xem chi tiết", intake: "Chỉ tiêu", profile: "Xem hồ sơ", previous: "Trước", next: "Tiếp theo",
  bannerRegion: "Banner giới thiệu nhà trường", bannerImage: "Ảnh banner", bannerDetails: "Xem chi tiết banner",
  previousBanner: "Banner trước", nextBanner: "Banner tiếp theo", resumeSlideshow: "Tiếp tục trình chiếu", pauseSlideshow: "Tạm dừng trình chiếu",
  resumeVideo: "Phát tiếp video", pauseVideo: "Tạm dừng video",
  alumniRegion: "Câu chuyện cựu sinh viên", alumni: "Cựu sinh viên nói gì", alumniTitle: "Câu chuyện thành công",
  previousStory: "Câu chuyện trước", nextStory: "Câu chuyện tiếp theo", manualSlides: "Chuyển bằng nút mũi tên",
  paused: "Tạm dừng", autoAdvance: "Tự động chuyển", seconds: "giây", backToTop: "Lên đầu trang",
  close: "Đóng", openVideo: "Mở video",
};

const en: typeof vi = {
  apply: "Apply for admission", applyNow: "Apply now", explorePrograms: "Explore programs",
  onlineApplication: "Apply online", results: "Application status", admissionResults: "Check admission results",
  library: "Media library", libraryDescription: "College photos & resources", lms: "Learning portal", lmsDescription: "VNPT digital learning resources",
  mission: "Mission", vision: "Vision", facultyStaff: "Faculty & staff", departments: "Departments", postgraduate: "Postgraduate qualifications",
  why: "Why choose Hop Luc", whyTitle: "Hands-on training,", whyEmphasis: "support", whyEnding: "through to employment",
  rotateModel: "Move your mouse to rotate the model", news: "News & events", newsTitle: "Hop Luc today", allNews: "View all news",
  postImage: "Article image", featuredNews: "Featured news", readMore: "Read more", notices: "Announcements", attachment: "Attachment",
  upcomingEvents: "Upcoming events", calendar: "Calendar", programs: "Programs", allPrograms: "View all programs",
  programsDescription: "Programs combine theory with clinical practice at partner hospitals from the first year.", programList: "Academic programs",
  faculty: "Our faculty", facultyTitle: "Faculty with extensive clinical experience", allFaculty: "Meet our faculty",
  studentLife: "Student life", experience: "Experience Hop Luc", viewLibrary: "View media library",
  viewVideo: "Watch video", viewImage: "View image", clinicalPractice: "Clinical practice", laboratory: "Laboratory",
  graduation: "Graduation", extracurricular: "Student activities", campus: "Campus",
  partners: "Partners", trainingPartners: "Training partners", partnersTitle: "Education & clinical practice partners", admissions: "Admissions",
  disclosures: "Public disclosures", disclosuresDescription: "Finance, facilities, academic programs and faculty",
  details: "Details", viewDetails: "View details", intake: "Intake", profile: "View profile", previous: "Previous", next: "Next",
  bannerRegion: "College introduction banners", bannerImage: "Banner image", bannerDetails: "View banner details",
  previousBanner: "Previous banner", nextBanner: "Next banner", resumeSlideshow: "Resume slideshow", pauseSlideshow: "Pause slideshow",
  resumeVideo: "Resume video", pauseVideo: "Pause video",
  alumniRegion: "Alumni stories", alumni: "What our alumni say", alumniTitle: "Success stories",
  previousStory: "Previous story", nextStory: "Next story", manualSlides: "Use the arrow buttons to change slides",
  paused: "Paused", autoAdvance: "Auto advance", seconds: "seconds", backToTop: "Back to top",
  close: "Close", openVideo: "Open video",
};

export function siteCopy(locale: Locale = "vi") {
  return locale === "en" ? en : vi;
}

export function programCountLabel(count: number, locale: Locale): string {
  return locale === "en" ? `${count} healthcare ${count === 1 ? "program" : "programs"}` : `${count} ngành trọng điểm khối sức khoẻ`;
}

export function admissionStepsLabel(count: number, locale: Locale): string {
  return locale === "en" ? `Process · ${count} admission ${count === 1 ? "step" : "steps"}` : `Quy trình · ${count} bước xét tuyển`;
}

const TIME_ZONE = "Asia/Ho_Chi_Minh";

export function siteDayMonth(iso: string | null, locale: Locale): { day: string; month: string } | null {
  if (!iso || Number.isNaN(new Date(iso).getTime())) return null;
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit", month: locale === "en" ? "short" : "numeric", timeZone: TIME_ZONE,
  }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return { day, month: locale === "en" ? month : `Th${month}` };
}

export function formatSiteDate(iso: string | null, locale: Locale, withTime = false): string {
  if (!iso || Number.isNaN(new Date(iso).getTime())) return "";
  const date = new Date(iso);
  const language = locale === "en" ? "en-GB" : "vi-VN";
  const label = date.toLocaleDateString(language, { timeZone: TIME_ZONE, ...(locale === "en" ? { day: "numeric", month: "short", year: "numeric" } as const : {}) });
  return withTime ? `${label} · ${date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })}` : label;
}

/** Chỉ đổi đơn vị thời lượng dạng số + đơn vị; không tự dịch/ghi đè văn bản tự do từ CMS. */
export function programDuration(value: string, locale: Locale): string {
  if (locale !== "en") return value;
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*(năm|tháng|tuần|ngày)$/iu);
  if (!match) return value;
  const units: Record<string, string> = { "năm": "year", "tháng": "month", "tuần": "week", "ngày": "day" };
  const amount = match[1].replace(",", ".");
  return `${amount} ${units[match[2].toLocaleLowerCase("vi")]}${Number(amount) === 1 ? "" : "s"}`;
}
