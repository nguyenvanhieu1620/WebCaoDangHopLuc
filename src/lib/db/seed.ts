import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./client";
import {
  adminUsers,
  posts,
  admissionSubmissions,
  programs,
  siteSettings,
  homepageContent,
} from "./schema";

/**
 * Script tạo dữ liệu mẫu ban đầu — chạy 1 lần sau khi `npm run db:push`.
 * Dùng: npm run db:seed
 */
async function main() {
  console.log("Đang seed dữ liệu mẫu...");

  // Tài khoản admin đầu tiên
  const existingAdmin = await db.query.adminUsers.findFirst({
    where: (u, { eq }) => eq(u.email, "admin@hopluc.edu.vn"),
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("HopLuc@2026", 10);
    await db.insert(adminUsers).values({
      email: "admin@hopluc.edu.vn",
      passwordHash,
      name: "Admin Hợp Lực",
    });
    console.log("✓ Tạo tài khoản admin: admin@hopluc.edu.vn / HopLuc@2026");
  } else {
    console.log("• Tài khoản admin đã tồn tại, bỏ qua.");
  }

  // Vài bài viết mẫu
  const existingPosts = await db.query.posts.findMany();
  if (existingPosts.length === 0) {
    await db.insert(posts).values([
      {
        title: "Mở cổng đăng ký xét tuyển đợt 2 năm 2026",
        slug: "mo-cong-dang-ky-xet-tuyen-dot-2-nam-2026",
        excerpt: "Ưu đãi học phí kỳ đầu cho 500 hồ sơ đăng ký sớm nhất.",
        content: "Nội dung chi tiết thông báo tuyển sinh đợt 2 năm 2026...",
        status: "published",
        publishedAt: new Date().toISOString(),
      },
      {
        title: "Ngày hội việc làm cùng 20 bệnh viện đối tác",
        slug: "ngay-hoi-viec-lam-cung-20-benh-vien-doi-tac",
        excerpt: "Kết nối trực tiếp sinh viên năm cuối với nhà tuyển dụng.",
        content: "Nội dung chi tiết về ngày hội việc làm...",
        status: "published",
        publishedAt: new Date().toISOString(),
      },
      {
        title: "Bản nháp: Thông báo lịch nghỉ Tết 2027",
        slug: "thong-bao-lich-nghi-tet-2027",
        excerpt: "Đang soạn thảo, chưa công bố.",
        content: "Nội dung đang soạn...",
        status: "draft",
      },
    ]);
    console.log("✓ Tạo 3 bài viết mẫu (2 đã đăng, 1 bản nháp)");
  } else {
    console.log("• Đã có bài viết, bỏ qua.");
  }

  // Vài hồ sơ đăng ký tuyển sinh mẫu
  const existingSubmissions = await db.query.admissionSubmissions.findMany();
  if (existingSubmissions.length === 0) {
    await db.insert(admissionSubmissions).values([
      { fullName: "Nguyễn Thị Mai", phone: "0901234567", program: "Điều dưỡng", status: "new" },
      { fullName: "Trần Văn Nam", phone: "0912345678", program: "Dược", status: "reviewed" },
      { fullName: "Lê Thị Hoa", phone: "0923456789", program: "Xét nghiệm Y học", status: "new" },
    ]);
    console.log("✓ Tạo 3 hồ sơ đăng ký tuyển sinh mẫu");
  } else {
    console.log("• Đã có hồ sơ đăng ký, bỏ qua.");
  }

  // Danh sách ngành đào tạo mặc định
  const existingPrograms = await db.query.programs.findMany();
  if (existingPrograms.length === 0) {
    await db.insert(programs).values([
      {
        slug: "dieu-duong",
        code: "ĐD",
        name: "Điều dưỡng",
        duration: "3 năm",
        intake: 350,
        summary:
          "Chăm sóc người bệnh toàn diện, kỹ năng lâm sàng vững vàng, cơ hội việc làm rộng mở tại các bệnh viện.",
        featured: 1,
      },
      {
        slug: "duoc",
        code: "DS",
        name: "Dược",
        duration: "3 năm",
        intake: 300,
        summary:
          "Bào chế, quản lý và tư vấn sử dụng thuốc an toàn tại nhà thuốc, bệnh viện, doanh nghiệp dược.",
        featured: 1,
      },
      {
        slug: "xet-nghiem-y-hoc",
        code: "XN",
        name: "Xét nghiệm Y học",
        duration: "3 năm",
        intake: 200,
        summary:
          "Phân tích, chẩn đoán cận lâm sàng hiện đại, làm việc tại khoa xét nghiệm các bệnh viện.",
        featured: 1,
      },
      {
        slug: "ho-sinh",
        code: "HS",
        name: "Hộ sinh",
        duration: "3 năm",
        intake: 150,
        summary:
          "Chăm sóc sức khỏe sinh sản mẹ và bé, hỗ trợ sinh nở an toàn tại các cơ sở y tế.",
        featured: 1,
      },
      {
        slug: "phuc-hoi-chuc-nang",
        code: "PHCN",
        name: "Phục hồi chức năng",
        duration: "3 năm",
        intake: 120,
        summary:
          "Vật lý trị liệu, phục hồi vận động cho người bệnh sau chấn thương, phẫu thuật.",
        featured: 1,
      },
      {
        slug: "y-si-da-khoa",
        code: "YS",
        name: "Y sĩ đa khoa",
        duration: "2 năm",
        intake: 180,
        summary:
          "Khám, điều trị bệnh thông thường tại tuyến cơ sở, trạm y tế xã phường.",
        featured: 1,
      },
    ]);
    console.log("✓ Tạo 6 ngành đào tạo mẫu");
  } else {
    console.log("• Đã có ngành đào tạo, bỏ qua.");
  }

  // Cài đặt chung của site (hotline, email, địa chỉ, banner, mạng xã hội)
  const existingSettings = await db.query.siteSettings.findFirst({
    where: (s, { eq }) => eq(s.id, "main"),
  });
  if (!existingSettings) {
    await db.insert(siteSettings).values({
      id: "main",
      hotline: "1900 6868",
      email: "tuyensinh@hopluc.edu.vn",
      address: "123 Đường Lê Lợi, TP. Thanh Hóa",
      announcement:
        "Tuyển sinh 2026 đang mở — Ưu đãi học phí kỳ đầu cho 500 hồ sơ sớm nhất",
      facebookUrl: "#",
      zaloUrl: "#",
      youtubeUrl: "#",
    });
    console.log("✓ Tạo cài đặt chung mặc định");
  } else {
    console.log("• Đã có cài đặt chung, bỏ qua.");
  }

  // Nội dung Trang chủ mặc định
  const existingHomepage = await db.query.homepageContent.findFirst({
    where: (h, { eq }) => eq(h.id, "main"),
  });
  if (!existingHomepage) {
    await db.insert(homepageContent).values({
      id: "main",
      heroBadge: "Tuyển sinh 2026",
      heroTitleLine1: "Học nghề chữa lành,",
      heroTitleLine2: "làm nghề tử tế.",
      heroDescription:
        "Đào tạo Điều dưỡng, Dược sĩ, Xét nghiệm và Y sĩ đa khoa theo chuẩn thực hành lâm sàng — cùng hơn 40 bệnh viện, nhà thuốc đối tác đồng hành từ năm nhất.",
      heroImageCardLabel: "Cơ sở thực hành",
      heroImageCardTitle: "Phòng lab chuẩn lâm sàng ngay trong khuôn viên trường",
      heroRatingValue: "4.8",
      heroRatingText: "Đánh giá từ 1.240 phụ huynh & sinh viên",
      statsJson: JSON.stringify([
        { value: "19+", label: "Năm kinh nghiệm đào tạo" },
        { value: "6", label: "Ngành đào tạo chính quy" },
        { value: "40+", label: "Bệnh viện & nhà thuốc đối tác" },
        { value: "92%", label: "Sinh viên có việc làm đúng ngành" },
      ]),
      featuresJson: JSON.stringify([
        {
          title: "Thực hành lâm sàng thật",
          desc: "Thực tập tại bệnh viện, nhà thuốc đối tác ngay từ học kỳ 2, không chỉ mô phỏng trên lớp.",
        },
        {
          title: "Giảng viên là người trong nghề",
          desc: "Đội ngũ giảng dạy là bác sĩ, dược sĩ, điều dưỡng trưởng đang làm việc tại các cơ sở y tế lớn.",
        },
        {
          title: "Cam kết đầu ra việc làm",
          desc: "Kết nối trực tiếp sinh viên năm cuối với nhà tuyển dụng qua ngày hội việc làm định kỳ mỗi năm.",
        },
      ]),
      stepsJson: JSON.stringify([
        {
          title: "Đăng ký trực tuyến",
          desc: "Điền form xét tuyển trên website, chọn ngành và đợt học mong muốn.",
        },
        {
          title: "Nộp hồ sơ",
          desc: "Tải ảnh học bạ/bằng tốt nghiệp — hệ thống xác nhận đã nhận trong 24 giờ.",
        },
        {
          title: "Nhận kết quả",
          desc: "Tra cứu kết quả xét tuyển trực tiếp trên website bằng số CCCD.",
        },
        {
          title: "Nhập học",
          desc: "Xác nhận nhập học, đóng học phí kỳ đầu và nhận lịch học chính thức.",
        },
      ]),
      ctaTitle: "Còn phân vân chọn ngành? Đăng ký để được tư vấn miễn phí.",
      ctaDescription:
        "Đội ngũ tư vấn tuyển sinh phản hồi trong vòng 24 giờ qua điện thoại hoặc Zalo.",
    });
    console.log("✓ Tạo nội dung Trang chủ mặc định");
  } else {
    console.log("• Đã có nội dung Trang chủ, bỏ qua.");
  }

  console.log("Seed hoàn tất.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
