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
  categories,
  partners,
  faculty,
  testimonials,
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
      heroImageUrl: null,
      heroBadge: "Tuyển sinh 2026",
      heroTitleLine1: "Kiến tạo nhân lực",
      heroTitleLine2: "y dược tận tâm & giỏi nghề",
      heroDescription:
        "Trường Cao đẳng Y Dược Hợp Lực đào tạo Điều dưỡng, Dược, Xét nghiệm cùng nhiều ngành y tế khác, gắn chặt lý thuyết với thực hành lâm sàng tại các bệnh viện đối tác.",
      heroBadge1Value: "12+",
      heroBadge1Label: "Năm đào tạo",
      heroBadge2Value: "96%",
      heroBadge2Label: "Có việc làm",
      statsJson: JSON.stringify([
        { value: "12+", label: "Năm kinh nghiệm đào tạo" },
        { value: "8.500+", label: "Sinh viên đã tốt nghiệp" },
        { value: "96%", label: "Sinh viên có việc làm" },
        { value: "40+", label: "Đối tác bệnh viện" },
      ]),
      featuresJson: JSON.stringify([
        {
          title: "Thực hành lâm sàng sớm",
          desc: "Sinh viên thực tập tại bệnh viện đối tác ngay từ năm nhất, tiếp cận môi trường làm việc thực tế.",
        },
        {
          title: "Giảng viên chuyên môn cao",
          desc: "Đội ngũ bác sĩ, dược sĩ giàu kinh nghiệm trực tiếp giảng dạy và hướng dẫn thực hành.",
        },
        {
          title: "Cam kết việc làm",
          desc: "Giới thiệu việc làm sau tốt nghiệp tại hệ thống bệnh viện, phòng khám đối tác trên toàn quốc.",
        },
      ]),
      stepsJson: JSON.stringify([
        { title: "Nộp hồ sơ", desc: "Đăng ký online hoặc nộp trực tiếp tại trường" },
        { title: "Xét tuyển học bạ", desc: "Xét theo kết quả học tập THPT" },
        { title: "Nhận kết quả", desc: "Tra cứu kết quả xét tuyển online" },
        { title: "Nhập học", desc: "Hoàn tất thủ tục và nhập học" },
      ]),
      ctaTitle: "Sẵn sàng cho hành trình y dược của bạn?",
      ctaDescription:
        "Nộp hồ sơ xét tuyển ngay hôm nay — đội ngũ tư vấn sẵn sàng hỗ trợ 24/7.",
    });
    console.log("✓ Tạo nội dung Trang chủ mặc định");
  } else {
    console.log("• Đã có nội dung Trang chủ, bỏ qua.");
  }

  // Danh mục bài viết mặc định
  const existingCategories = await db.query.categories.findMany();
  if (existingCategories.length === 0) {
    await db.insert(categories).values([
      { name: "Tuyển sinh", slug: "tuyen-sinh" },
      { name: "Sự kiện", slug: "su-kien" },
      { name: "Hợp tác", slug: "hop-tac" },
      { name: "Đào tạo", slug: "dao-tao" },
    ]);
    console.log("✓ Tạo 4 danh mục bài viết mẫu");
  } else {
    console.log("• Đã có danh mục bài viết, bỏ qua.");
  }

  // Đối tác mặc định
  const existingPartners = await db.query.partners.findMany();
  if (existingPartners.length === 0) {
    await db.insert(partners).values([
      { name: "Trường Đại học Y tế Đài Loan", sortOrder: 0 },
      { name: "BV Nhi Thanh Hóa", sortOrder: 1 },
      { name: "Sở Y tế Thanh Hóa", sortOrder: 2 },
      { name: "BV 71 TW", sortOrder: 3 },
      { name: "Trung tâm Y tế Quảng Xương", sortOrder: 4 },
    ]);
    console.log("✓ Tạo 5 đối tác mẫu");
  } else {
    console.log("• Đã có đối tác, bỏ qua.");
  }

  // Đội ngũ giảng viên mặc định
  const existingFaculty = await db.query.faculty.findMany();
  if (existingFaculty.length === 0) {
    await db.insert(faculty).values([
      { name: "ThS.BS Nguyễn Văn An", role: "Trưởng khoa Điều dưỡng", sortOrder: 0 },
      { name: "DS.CKI Trần Thị Bình", role: "Trưởng khoa Dược", sortOrder: 1 },
      { name: "ThS Lê Văn Cường", role: "Trưởng khoa Xét nghiệm", sortOrder: 2 },
      { name: "BS.CKII Phạm Thị Dung", role: "Phó Hiệu trưởng", sortOrder: 3 },
    ]);
    console.log("✓ Tạo 4 giảng viên mẫu");
  } else {
    console.log("• Đã có giảng viên, bỏ qua.");
  }

  // Đánh giá cựu sinh viên mặc định
  const existingTestimonials = await db.query.testimonials.findMany();
  if (existingTestimonials.length === 0) {
    await db.insert(testimonials).values([
      {
        quote:
          "Nhờ chương trình thực hành sớm tại Hợp Lực, tôi tự tin làm việc ngay sau khi tốt nghiệp.",
        name: "Vũ Thị Hoa",
        role: "Điều dưỡng viên, BV Đa khoa tỉnh",
        sortOrder: 0,
      },
      {
        quote:
          "Giảng viên tận tâm, cơ sở vật chất hiện đại giúp tôi vững kiến thức chuyên môn.",
        name: "Đỗ Văn Hùng",
        role: "Dược sĩ, Nhà thuốc Long Châu",
        sortOrder: 1,
      },
    ]);
    console.log("✓ Tạo 2 đánh giá cựu sinh viên mẫu");
  } else {
    console.log("• Đã có đánh giá cựu sinh viên, bỏ qua.");
  }

  console.log("Seed hoàn tất.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
