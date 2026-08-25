import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { slugify } from "../utils";
import { autoFillTranslations } from "../translate";
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
  departments,
  facultyAttributes,
  testimonials,
  navItems,
  pages,
  events,
  faqs,
  quickContacts,
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
      { fullName: "Nguyễn Thị Mai", phone: "0901234567", idNumber: "038201001234", program: "Điều dưỡng", status: "new" },
      { fullName: "Trần Văn Nam", phone: "0912345678", idNumber: "038201005678", program: "Dược", status: "reviewed" },
      { fullName: "Lê Thị Hoa", phone: "0923456789", idNumber: "038201009012", program: "Xét nghiệm Y học", status: "new" },
    ]);
    console.log("✓ Tạo 3 hồ sơ đăng ký tuyển sinh mẫu");
  } else {
    console.log("• Đã có hồ sơ đăng ký, bỏ qua.");
    // Backfill idNumber cho dữ liệu mẫu tạo trước khi có cột này (bảng cũ hơn schema)
    const demoIdNumbers: Record<string, string> = {
      "Nguyễn Thị Mai": "038201001234",
      "Trần Văn Nam": "038201005678",
      "Lê Thị Hoa": "038201009012",
    };
    for (const s of existingSubmissions) {
      if (!s.idNumber && demoIdNumbers[s.fullName]) {
        await db
          .update(admissionSubmissions)
          .set({ idNumber: demoIdNumbers[s.fullName] })
          .where(eq(admissionSubmissions.id, s.id));
      }
    }
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

  // Backfill bản tiếng Anh cho ngành đào tạo (idempotent — chỉ set khi đang trống)
  const programTranslations: Record<string, { nameEn: string; summaryEn: string }> = {
    "dieu-duong": {
      nameEn: "Nursing",
      summaryEn:
        "Comprehensive patient care with strong clinical skills — broad job opportunities at hospitals.",
    },
    duoc: {
      nameEn: "Pharmacy",
      summaryEn:
        "Drug compounding, management, and safe-use counseling at pharmacies, hospitals, and pharmaceutical companies.",
    },
    "xet-nghiem-y-hoc": {
      nameEn: "Medical Laboratory Science",
      summaryEn:
        "Modern diagnostic laboratory analysis — working in hospital testing departments.",
    },
    "ho-sinh": {
      nameEn: "Midwifery",
      summaryEn:
        "Maternal and child reproductive health care, supporting safe childbirth at healthcare facilities.",
    },
    "phuc-hoi-chuc-nang": {
      nameEn: "Physical Therapy & Rehabilitation",
      summaryEn:
        "Physical therapy and mobility rehabilitation for patients after injury or surgery.",
    },
    "y-si-da-khoa": {
      nameEn: "General Medicine Practitioner",
      summaryEn: "Examining and treating common illnesses at grassroots health stations.",
    },
  };
  for (const [slug, t] of Object.entries(programTranslations)) {
    const row = await db.query.programs.findFirst({ where: (p, { eq }) => eq(p.slug, slug) });
    if (row && !row.nameEn) {
      await db.update(programs).set(t).where(eq(programs.id, row.id));
    }
  }

  // Nội dung chi tiết ngành đào tạo (cho trang /nganh-dao-tao/[slug]) —
  // nội dung THAM KHẢO/DEMO mô tả chương trình học nói chung (không phải
  // số liệu/cam kết chính thức của trường), backfill idempotent (chỉ set
  // khi `content` đang trống, không ghi đè nếu admin đã tự nhập).
  const programContent: Record<string, string> = {
    "dieu-duong": `## Mục tiêu đào tạo
Đào tạo Điều dưỡng viên có kiến thức chuyên môn vững, kỹ năng chăm sóc người bệnh toàn diện, thành thạo quy trình điều dưỡng và có khả năng làm việc độc lập lẫn phối hợp trong nhóm chăm sóc sức khoẻ.

## Nội dung chương trình
- Giải phẫu — sinh lý, Dược lý, Bệnh học cơ sở
- Điều dưỡng cơ bản, Điều dưỡng nội khoa, ngoại khoa, sản — nhi
- Kỹ năng giao tiếp và chăm sóc người bệnh
- Quản lý điều dưỡng, kiểm soát nhiễm khuẩn

## Thực hành lâm sàng
Thực tập tại các khoa lâm sàng của bệnh viện đối tác ngay từ năm 2, dưới sự hướng dẫn của điều dưỡng trưởng và giảng viên lâm sàng.

## Cơ hội nghề nghiệp
Làm việc tại các khoa lâm sàng bệnh viện công/tư, phòng khám, trung tâm y tế, hoặc tiếp tục học liên thông lên Đại học Điều dưỡng.`,
    duoc: `## Mục tiêu đào tạo
Đào tạo Dược sĩ trình độ Cao đẳng nắm vững kiến thức bào chế, quản lý dược và tư vấn sử dụng thuốc an toàn, hợp lý cho người dân.

## Nội dung chương trình
- Hoá dược, Dược liệu, Bào chế và sinh dược học
- Dược lý, Dược lâm sàng, Quản lý và kinh tế dược
- Pháp chế dược, Đảm bảo chất lượng thuốc

## Thực hành nghề nghiệp
Thực tập tại nhà thuốc, khoa dược bệnh viện và cơ sở sản xuất dược phẩm — rèn kỹ năng tư vấn, cấp phát và quản lý thuốc thực tế.

## Cơ hội nghề nghiệp
Làm việc tại nhà thuốc, khoa dược bệnh viện, công ty dược phẩm (sản xuất, phân phối, trình dược), hoặc học liên thông lên Đại học Dược.`,
    "xet-nghiem-y-hoc": `## Mục tiêu đào tạo
Đào tạo Kỹ thuật viên xét nghiệm y học thành thạo các kỹ thuật xét nghiệm huyết học, sinh hoá, vi sinh, giải phẫu bệnh phục vụ chẩn đoán và điều trị.

## Nội dung chương trình
- Hoá sinh, Vi sinh, Huyết học — truyền máu
- Kỹ thuật xét nghiệm cơ bản và chuyên sâu
- Kiểm soát chất lượng xét nghiệm, An toàn sinh học phòng xét nghiệm

## Thực hành lâm sàng
Thực tập tại khoa xét nghiệm các bệnh viện, làm quen với hệ thống máy móc xét nghiệm hiện đại đang sử dụng trong thực tế.

## Cơ hội nghề nghiệp
Làm việc tại khoa xét nghiệm bệnh viện, trung tâm y tế dự phòng, phòng xét nghiệm tư nhân, hoặc học liên thông lên Đại học Kỹ thuật Y học.`,
    "ho-sinh": `## Mục tiêu đào tạo
Đào tạo Hộ sinh viên có năng lực chăm sóc sức khoẻ sinh sản phụ nữ, theo dõi thai kỳ và hỗ trợ sinh nở an toàn cho mẹ và bé.

## Nội dung chương trình
- Sản phụ khoa, Chăm sóc sức khoẻ sinh sản
- Kỹ năng đỡ đẻ, chăm sóc sơ sinh
- Kế hoạch hoá gia đình, Giáo dục sức khoẻ cộng đồng

## Thực hành lâm sàng
Thực tập tại khoa sản các bệnh viện, trực tiếp tham gia hỗ trợ theo dõi thai sản dưới sự giám sát của hộ sinh và bác sĩ hướng dẫn.

## Cơ hội nghề nghiệp
Làm việc tại khoa sản bệnh viện, trạm y tế, trung tâm chăm sóc sức khoẻ sinh sản, hoặc học liên thông lên Đại học Hộ sinh.`,
    "phuc-hoi-chuc-nang": `## Mục tiêu đào tạo
Đào tạo Kỹ thuật viên Phục hồi chức năng có khả năng đánh giá, xây dựng và thực hiện chương trình vật lý trị liệu — phục hồi vận động cho người bệnh.

## Nội dung chương trình
- Giải phẫu vận động, Vật lý trị liệu đại cương
- Phục hồi chức năng thần kinh, cơ — xương — khớp
- Dụng cụ chỉnh hình, hỗ trợ vận động

## Thực hành lâm sàng
Thực tập tại khoa Phục hồi chức năng bệnh viện, trực tiếp hỗ trợ tập luyện cho người bệnh sau chấn thương, phẫu thuật, đột quỵ.

## Cơ hội nghề nghiệp
Làm việc tại khoa Phục hồi chức năng bệnh viện, trung tâm vật lý trị liệu, hoặc học liên thông lên Đại học Kỹ thuật Phục hồi chức năng.`,
    "y-si-da-khoa": `## Mục tiêu đào tạo
Đào tạo Y sĩ đa khoa có khả năng khám, chẩn đoán và điều trị các bệnh thông thường, xử trí ban đầu cấp cứu tại tuyến y tế cơ sở.

## Nội dung chương trình
- Giải phẫu — sinh lý, Bệnh học nội — ngoại — sản — nhi
- Chẩn đoán và điều trị bệnh thông thường
- Sơ cấp cứu, Y học cộng đồng

## Thực hành lâm sàng
Thực tập tại các khoa lâm sàng bệnh viện và trạm y tế xã/phường, làm quen với thực tế khám chữa bệnh tại tuyến cơ sở.

## Cơ hội nghề nghiệp
Làm việc tại trạm y tế xã/phường, phòng khám đa khoa, hoặc học liên thông lên Đại học Y.`,
  };
  const programContentPairs: { slug: string; vi: string }[] = [];
  for (const [slug, content] of Object.entries(programContent)) {
    const row = await db.query.programs.findFirst({ where: (p, { eq }) => eq(p.slug, slug) });
    if (row && !row.content) programContentPairs.push({ slug, vi: content });
  }
  if (programContentPairs.length > 0) {
    const translatedContents = await autoFillTranslations(
      programContentPairs.map((p) => ({ vi: p.vi, en: "" }))
    );
    for (let i = 0; i < programContentPairs.length; i++) {
      const { slug, vi } = programContentPairs[i];
      await db
        .update(programs)
        .set({ content: vi, contentEn: translatedContents[i] || null })
        .where(eq(programs.slug, slug));
    }
    console.log(`✓ Backfill nội dung chi tiết cho ${programContentPairs.length} ngành đào tạo`);
  } else {
    console.log("• Ngành đào tạo đã có nội dung chi tiết, bỏ qua backfill.");
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

  // Backfill bản tiếng Anh cho banner thông báo (idempotent)
  const settingsRow = await db.query.siteSettings.findFirst({ where: (s, { eq }) => eq(s.id, "main") });
  if (settingsRow && !settingsRow.announcementEn) {
    await db
      .update(siteSettings)
      .set({
        announcementEn:
          "Admissions 2026 now open — Tuition discount for the first 500 early applicants",
      })
      .where(eq(siteSettings.id, "main"));
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
      missionText:
        "Đào tạo đội ngũ Điều dưỡng, Dược sĩ, Kỹ thuật viên xét nghiệm và các ngành y tế khác vững chuyên môn, giàu y đức, đáp ứng nhu cầu nhân lực ngành y tế trong nước và khu vực.",
      visionText:
        "Trở thành trường cao đẳng y dược uy tín hàng đầu khu vực Bắc Trung Bộ, gắn đào tạo với thực hành lâm sàng thực chiến ngay từ năm nhất.",
    });
    console.log("✓ Tạo nội dung Trang chủ mặc định");
  } else {
    console.log("• Đã có nội dung Trang chủ, bỏ qua.");
  }

  // Backfill Sứ mệnh/Tầm nhìn (idempotent) — cột mới thêm sau khi đã có dữ liệu
  const homepageMissionRow = await db.query.homepageContent.findFirst({
    where: (h, { eq }) => eq(h.id, "main"),
  });
  if (homepageMissionRow && !homepageMissionRow.missionText) {
    await db
      .update(homepageContent)
      .set({
        missionText:
          "Đào tạo đội ngũ Điều dưỡng, Dược sĩ, Kỹ thuật viên xét nghiệm và các ngành y tế khác vững chuyên môn, giàu y đức, đáp ứng nhu cầu nhân lực ngành y tế trong nước và khu vực.",
        visionText:
          "Trở thành trường cao đẳng y dược uy tín hàng đầu khu vực Bắc Trung Bộ, gắn đào tạo với thực hành lâm sàng thực chiến ngay từ năm nhất.",
      })
      .where(eq(homepageContent.id, "main"));
  }

  // Backfill bản tiếng Anh cho nội dung Trang chủ (idempotent)
  const homepageRow = await db.query.homepageContent.findFirst({ where: (h, { eq }) => eq(h.id, "main") });
  if (homepageRow && !homepageRow.heroBadgeEn) {
    await db
      .update(homepageContent)
      .set({
        heroBadgeEn: "Admissions 2026",
        heroTitleLine1En: "Building",
        heroTitleLine2En: "dedicated & skilled healthcare talent",
        heroDescriptionEn:
          "Hop Luc Medical Pharmacy College trains Nursing, Pharmacy, Laboratory Science and other healthcare majors, closely combining theory with clinical practice at partner hospitals.",
        heroBadge1LabelEn: "Years of training",
        heroBadge2LabelEn: "Employed after graduation",
        statsJsonEn: JSON.stringify([
          { label: "Years of training experience" },
          { label: "Graduates" },
          { label: "Students employed" },
          { label: "Hospital partners" },
        ]),
        featuresJsonEn: JSON.stringify([
          {
            title: "Early clinical practice",
            desc: "Students train at partner hospitals from year one, gaining real-world work experience.",
          },
          {
            title: "Highly qualified faculty",
            desc: "Experienced doctors and pharmacists teach and directly supervise practical training.",
          },
          {
            title: "Employment commitment",
            desc: "Job placement support after graduation across our nationwide network of partner hospitals and clinics.",
          },
        ]),
        stepsJsonEn: JSON.stringify([
          { title: "Submit application", desc: "Apply online or in person at the school" },
          { title: "Transcript-based admission", desc: "Evaluated by high school academic results" },
          { title: "Receive results", desc: "Check admission results online" },
          { title: "Enrollment", desc: "Complete procedures and enroll" },
        ]),
        ctaTitleEn: "Ready to start your healthcare career journey?",
        ctaDescriptionEn: "Submit your application today — our admissions team is ready to help 24/7.",
      })
      .where(eq(homepageContent.id, "main"));
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

  // Danh mục "Học bổng" — thêm riêng vì tạo sau đợt seed 4 danh mục đầu
  // (tận dụng Danh mục bài viết có sẵn thay vì làm bảng riêng cho Học bổng).
  const existingScholarshipCategory = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, "hoc-bong"),
  });
  if (!existingScholarshipCategory) {
    await db.insert(categories).values({ name: "Học bổng", nameEn: "Scholarships", slug: "hoc-bong" });
    console.log("✓ Tạo danh mục Học bổng");
  } else {
    console.log("• Đã có danh mục Học bổng, bỏ qua.");
  }

  // Backfill bản tiếng Anh cho danh mục bài viết (idempotent)
  const categoryTranslations: Record<string, string> = {
    "tuyen-sinh": "Admissions",
    "su-kien": "Events",
    "hop-tac": "Partnerships",
    "dao-tao": "Training",
  };
  for (const [slug, nameEn] of Object.entries(categoryTranslations)) {
    const row = await db.query.categories.findFirst({ where: (c, { eq }) => eq(c.slug, slug) });
    if (row && !row.nameEn) {
      await db.update(categories).set({ nameEn }).where(eq(categories.id, row.id));
    }
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

  // Học hàm / Học vị / Chức vụ mặc định — cho dropdown ở admin/giang-vien
  const existingAttributes = await db.query.facultyAttributes.findMany();
  if (existingAttributes.length === 0) {
    await db.insert(facultyAttributes).values([
      { type: "academic_rank", name: "GS", sortOrder: 0 },
      { type: "academic_rank", name: "PGS", sortOrder: 1 },
      { type: "degree", name: "TS", sortOrder: 0 },
      { type: "degree", name: "ThS", sortOrder: 1 },
      { type: "degree", name: "ThS.BS", sortOrder: 2 },
      { type: "degree", name: "BS", sortOrder: 3 },
      { type: "degree", name: "BS.CKI", sortOrder: 4 },
      { type: "degree", name: "BS.CKII", sortOrder: 5 },
      { type: "degree", name: "DS", sortOrder: 6 },
      { type: "degree", name: "DS.CKI", sortOrder: 7 },
      { type: "degree", name: "DS.CKII", sortOrder: 8 },
      { type: "degree", name: "CN", sortOrder: 9 },
      { type: "position", name: "Hiệu trưởng", sortOrder: 0 },
      { type: "position", name: "Phó Hiệu trưởng", sortOrder: 1 },
      { type: "position", name: "Trưởng khoa Điều dưỡng", sortOrder: 2 },
      { type: "position", name: "Trưởng khoa Dược", sortOrder: 3 },
      { type: "position", name: "Trưởng khoa Xét nghiệm", sortOrder: 4 },
      { type: "position", name: "Trưởng bộ môn", sortOrder: 5 },
      { type: "position", name: "Giảng viên", sortOrder: 6 },
    ]);
    console.log("✓ Tạo danh sách Học hàm/Học vị/Chức vụ mặc định");
  } else {
    console.log("• Đã có Học hàm/Học vị/Chức vụ, bỏ qua.");
  }

  // Khoa/Bộ môn mặc định
  const existingDepartments = await db.query.departments.findMany();
  if (existingDepartments.length === 0) {
    await db.insert(departments).values([
      { name: "Ban Giám hiệu", sortOrder: 0 },
      { name: "Khoa Điều dưỡng", sortOrder: 1 },
      { name: "Khoa Dược", sortOrder: 2 },
      { name: "Khoa Xét nghiệm", sortOrder: 3 },
    ]);
    console.log("✓ Tạo 4 khoa/bộ môn mặc định");
  } else {
    console.log("• Đã có khoa/bộ môn, bỏ qua.");
  }
  const departmentIdByName = new Map(
    (await db.query.departments.findMany()).map((d) => [d.name, d.id])
  );

  // Đội ngũ giảng viên mặc định — tên chỉ chứa họ tên thuần, học vị/học hàm tách riêng
  const existingFaculty = await db.query.faculty.findMany();
  if (existingFaculty.length === 0) {
    await db.insert(faculty).values([
      {
        slug: "nguyen-van-an",
        name: "Nguyễn Văn An",
        degree: "ThS.BS",
        role: "Trưởng khoa Điều dưỡng",
        departmentId: departmentIdByName.get("Khoa Điều dưỡng"),
        sortOrder: 0,
      },
      {
        slug: "tran-thi-binh",
        name: "Trần Thị Bình",
        degree: "DS.CKI",
        role: "Trưởng khoa Dược",
        departmentId: departmentIdByName.get("Khoa Dược"),
        sortOrder: 1,
      },
      {
        slug: "le-van-cuong",
        name: "Lê Văn Cường",
        degree: "ThS",
        role: "Trưởng khoa Xét nghiệm",
        departmentId: departmentIdByName.get("Khoa Xét nghiệm"),
        sortOrder: 2,
      },
      {
        slug: "pham-thi-dung",
        name: "Phạm Thị Dung",
        degree: "BS.CKII",
        role: "Phó Hiệu trưởng",
        departmentId: departmentIdByName.get("Ban Giám hiệu"),
        sortOrder: 3,
      },
    ]);
    console.log("✓ Tạo 4 giảng viên mẫu");
  } else {
    console.log("• Đã có giảng viên, bỏ qua.");
    // Backfill slug cho giảng viên tạo trước khi có cột này (dùng cho trang chi tiết)
    for (const f of existingFaculty) {
      if (!f.slug) {
        const baseSlug = slugify(f.name) || `giang-vien-${f.id.slice(0, 8)}`;
        let slug = baseSlug;
        let counter = 1;
        while (await db.query.faculty.findFirst({ where: (r, { eq }) => eq(r.slug, slug) })) {
          counter += 1;
          slug = `${baseSlug}-${counter}`;
        }
        await db.update(faculty).set({ slug }).where(eq(faculty.id, f.id));
      }
    }
    // Backfill tách học vị khỏi tên + gán khoa cho 4 giảng viên mẫu tạo trước khi có
    // các cột degree/departmentId — chỉ áp dụng cho đúng tên mẫu gốc, không đụng dữ
    // liệu admin đã tự sửa (kiểm tra degree đang null mới backfill).
    const facultyBackfill: Record<string, { name: string; degree: string; department: string }> = {
      "ThS.BS Nguyễn Văn An": { name: "Nguyễn Văn An", degree: "ThS.BS", department: "Khoa Điều dưỡng" },
      "DS.CKI Trần Thị Bình": { name: "Trần Thị Bình", degree: "DS.CKI", department: "Khoa Dược" },
      "ThS Lê Văn Cường": { name: "Lê Văn Cường", degree: "ThS", department: "Khoa Xét nghiệm" },
      "BS.CKII Phạm Thị Dung": { name: "Phạm Thị Dung", degree: "BS.CKII", department: "Ban Giám hiệu" },
    };
    for (const f of existingFaculty) {
      const info = facultyBackfill[f.name];
      if (info && !f.degree) {
        await db
          .update(faculty)
          .set({ name: info.name, degree: info.degree, departmentId: departmentIdByName.get(info.department) })
          .where(eq(faculty.id, f.id));
      }
    }
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

  // Menu chính mặc định — minh hoạ danh mục to/con bằng Ngành đào tạo
  const existingNavItems = await db.query.navItems.findMany();
  if (existingNavItems.length === 0) {
    await db.insert(navItems).values([
      { label: "Trang chủ", href: "/", isPrimary: 1, sortOrder: 0 },
      { label: "Giới thiệu", href: "/gioi-thieu", isPrimary: 1, sortOrder: 1 },
      { label: "Ngành đào tạo", href: "/nganh-dao-tao", isPrimary: 1, sortOrder: 2 },
      { label: "Tuyển sinh", href: "/tuyen-sinh", isPrimary: 1, sortOrder: 3 },
      { label: "Tin tức", href: "/tin-tuc", isPrimary: 1, sortOrder: 4 },
      { label: "Liên hệ", href: "/lien-he", isPrimary: 1, sortOrder: 5 },
    ]);

    const programsParent = await db.query.navItems.findFirst({
      where: (n, { eq }) => eq(n.href, "/nganh-dao-tao"),
    });
    if (!programsParent) throw new Error("Không tìm thấy nav item Ngành đào tạo vừa tạo");

    await db.insert(navItems).values([
      { label: "Điều dưỡng", href: "/nganh-dao-tao/dieu-duong", parentId: programsParent.id, sortOrder: 0 },
      { label: "Dược", href: "/nganh-dao-tao/duoc", parentId: programsParent.id, sortOrder: 1 },
      { label: "Xét nghiệm Y học", href: "/nganh-dao-tao/xet-nghiem-y-hoc", parentId: programsParent.id, sortOrder: 2 },
      { label: "Hộ sinh", href: "/nganh-dao-tao/ho-sinh", parentId: programsParent.id, sortOrder: 3 },
      { label: "Phục hồi chức năng", href: "/nganh-dao-tao/phuc-hoi-chuc-nang", parentId: programsParent.id, sortOrder: 4 },
      { label: "Y sĩ đa khoa", href: "/nganh-dao-tao/y-si-da-khoa", parentId: programsParent.id, sortOrder: 5 },
    ]);

    await db.insert(navItems).values([
      { label: "Tra cứu KQ", href: "/tra-cuu-ket-qua", isPrimary: 0, sortOrder: 6 },
      { label: "Thư viện", href: "/thu-vien", isPrimary: 0, sortOrder: 7 },
      { label: "LMS VNPT", href: "/lms", isPrimary: 0, sortOrder: 8 },
    ]);

    console.log("✓ Tạo menu chính mặc định (6 danh mục to, 6 danh mục con dưới Ngành đào tạo, 3 danh mục khác)");
  } else {
    console.log("• Đã có menu chính, bỏ qua.");
  }

  // Mục menu "Đội ngũ giảng viên" — trang đầy đủ mới, nằm trong nút ☰ (danh mục khác)
  const existingFacultyNav = await db.query.navItems.findFirst({
    where: (n, { eq }) => eq(n.href, "/doi-ngu-giang-vien"),
  });
  if (!existingFacultyNav) {
    await db.insert(navItems).values({
      label: "Đội ngũ giảng viên",
      labelEn: "Faculty",
      href: "/doi-ngu-giang-vien",
      isPrimary: 0,
      sortOrder: 10,
    });
    console.log("✓ Tạo mục menu Đội ngũ giảng viên");
  } else {
    console.log("• Đã có mục menu Đội ngũ giảng viên, bỏ qua.");
  }

  // Mục menu "Sự kiện" và "Câu hỏi thường gặp" — cũng nằm trong nút ☰
  const existingEventsNav = await db.query.navItems.findFirst({
    where: (n, { eq }) => eq(n.href, "/su-kien"),
  });
  if (!existingEventsNav) {
    await db.insert(navItems).values({
      label: "Sự kiện",
      labelEn: "Events",
      href: "/su-kien",
      isPrimary: 0,
      sortOrder: 11,
    });
    console.log("✓ Tạo mục menu Sự kiện");
  } else {
    console.log("• Đã có mục menu Sự kiện, bỏ qua.");
  }

  const existingFaqNav = await db.query.navItems.findFirst({
    where: (n, { eq }) => eq(n.href, "/faq"),
  });
  if (!existingFaqNav) {
    await db.insert(navItems).values({
      label: "Câu hỏi thường gặp",
      labelEn: "FAQ",
      href: "/faq",
      isPrimary: 0,
      sortOrder: 12,
    });
    console.log("✓ Tạo mục menu Câu hỏi thường gặp");
  } else {
    console.log("• Đã có mục menu Câu hỏi thường gặp, bỏ qua.");
  }

  const existingScholarshipNav = await db.query.navItems.findFirst({
    where: (n, { eq }) => eq(n.href, "/tin-tuc?category=hoc-bong"),
  });
  if (!existingScholarshipNav) {
    await db.insert(navItems).values({
      label: "Học bổng",
      labelEn: "Scholarships",
      href: "/tin-tuc?category=hoc-bong",
      isPrimary: 0,
      sortOrder: 13,
    });
    console.log("✓ Tạo mục menu Học bổng");
  } else {
    console.log("• Đã có mục menu Học bổng, bỏ qua.");
  }

  // Sự kiện mẫu
  const existingEvents = await db.query.events.findMany();
  if (existingEvents.length === 0) {
    const inThreeWeeks = new Date();
    inThreeWeeks.setDate(inThreeWeeks.getDate() + 21);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    await db.insert(events).values([
      {
        slug: "ngay-hoi-tu-van-tuyen-sinh-2026",
        title: "Ngày hội tư vấn tuyển sinh 2026",
        description:
          "Tư vấn trực tiếp về các ngành đào tạo, học phí, học bổng và cơ hội việc làm sau tốt nghiệp.",
        location: "Hội trường A, cơ sở chính",
        startAt: inThreeWeeks.toISOString(),
      },
      {
        slug: "le-tot-nghiep-khoa-2023-2026",
        title: "Lễ tốt nghiệp khoá 2023-2026",
        description: "Lễ tốt nghiệp và trao bằng cho sinh viên khoá 2023-2026.",
        location: "Hội trường lớn",
        startAt: twoMonthsAgo.toISOString(),
      },
    ]);
    console.log("✓ Tạo 2 sự kiện mẫu");
  } else {
    console.log("• Đã có sự kiện, bỏ qua.");
  }

  // Backfill slug cho sự kiện đã tồn tại trước khi có cột này (idempotent).
  const eventsWithoutSlug = await db.query.events.findMany();
  for (const row of eventsWithoutSlug) {
    if (!row.slug) {
      const baseSlug = slugify(row.title) || `su-kien-${row.id.slice(0, 8)}`;
      let slug = baseSlug;
      let counter = 1;
      while (await db.query.events.findFirst({ where: (e, { eq: eqOp }) => eqOp(e.slug, slug) })) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }
      await db.update(events).set({ slug }).where(eq(events.id, row.id));
      console.log(`✓ Backfill slug cho sự kiện "${row.title}"`);
    }
  }

  // Câu hỏi thường gặp mẫu
  const existingFaqs = await db.query.faqs.findMany();
  if (existingFaqs.length === 0) {
    await db.insert(faqs).values([
      {
        question: "Học phí năm 2026 là bao nhiêu?",
        answer:
          "Học phí tuỳ theo từng ngành đào tạo — xem chi tiết tại trang từng ngành ở mục Ngành đào tạo, hoặc liên hệ hotline để được tư vấn cụ thể.",
        sortOrder: 0,
      },
      {
        question: "Hồ sơ xét tuyển cần những gì?",
        answer:
          "Hồ sơ gồm: bản sao học bạ/bằng tốt nghiệp THPT, CCCD, ảnh 3x4 và đơn đăng ký xét tuyển — nộp trực tuyến qua trang Tuyển sinh hoặc trực tiếp tại trường.",
        sortOrder: 1,
      },
      {
        question: "Sau khi nộp hồ sơ, khi nào có kết quả?",
        answer:
          "Kết quả xét tuyển thường có sau 3-5 ngày làm việc — tra cứu bằng số CCCD tại trang Tra cứu kết quả.",
        sortOrder: 2,
      },
    ]);
    console.log("✓ Tạo 3 câu hỏi thường gặp mẫu");
  } else {
    console.log("• Đã có câu hỏi thường gặp, bỏ qua.");
  }


  // Trang "Công khai" mặc định — nội dung là KHUNG THEO ĐÚNG QUY ĐỊNH
  // (Thông tư 36/2017 — "3 công khai" cho cơ sở GDNN), số liệu để dạng
  // placeholder trong ngoặc vuông, KHÔNG bịa số liệu thật — trường tự cập
  // nhật qua admin/trang-tinh trước khi công bố chính thức.
  const congKhaiSlugs = [
    "cong-khai-tai-chinh",
    "cong-khai-co-so-vat-chat",
    "cong-khai-chuong-trinh-dao-tao",
    "cong-khai-doi-ngu-giang-vien",
  ];
  const existingCongKhai = await db.query.pages.findMany({
    where: (p, { inArray }) => inArray(p.slug, congKhaiSlugs),
  });
  if (existingCongKhai.length === 0) {
    await db.insert(pages).values([
      {
        slug: "cong-khai-tai-chinh",
        title: "Công khai tài chính",
        content: `Thực hiện theo quy định về công khai tài chính đối với cơ sở giáo dục nghề nghiệp.

— Học phí năm học [điền năm học]: [điền mức học phí theo từng ngành]
— Các khoản thu khác (nếu có): [điền chi tiết]
— Tổng nguồn thu năm [điền năm]: [điền số liệu]
— Tổng chi năm [điền năm]: [điền số liệu]

[Ban Tài chính — Kế toán cập nhật số liệu chính thức trước khi công bố]`,
      },
      {
        slug: "cong-khai-co-so-vat-chat",
        title: "Công khai cơ sở vật chất",
        content: `— Tổng diện tích khuôn viên: [điền số liệu] m²
— Số phòng học lý thuyết: [điền số lượng]
— Số phòng/xưởng thực hành, thực tập: [điền số lượng]
— Thư viện: [điền quy mô, số đầu sách]
— Ký túc xá (nếu có): [điền quy mô]
— Trang thiết bị thực hành chính: [điền danh mục]

[Phòng Quản trị — Cơ sở vật chất cập nhật số liệu chính thức trước khi công bố]`,
      },
      {
        slug: "cong-khai-chuong-trinh-dao-tao",
        title: "Công khai chương trình đào tạo",
        content: `Danh sách ngành đào tạo và thời lượng chương trình — xem chi tiết từng
ngành tại trang /nganh-dao-tao.

— Chuẩn đầu ra: [điền chuẩn đầu ra theo từng ngành]
— Khối lượng kiến thức toàn khoá: [điền số tín chỉ/đơn vị học trình]
— Tỷ lệ thời lượng lý thuyết/thực hành: [điền tỷ lệ]
— Tỷ lệ sinh viên tốt nghiệp có việc làm đúng ngành: [điền số liệu khảo sát]

[Phòng Đào tạo cập nhật số liệu chính thức trước khi công bố]`,
      },
      {
        slug: "cong-khai-doi-ngu-giang-vien",
        title: "Công khai đội ngũ giảng viên",
        content: `— Tổng số giảng viên cơ hữu: [điền số lượng]
— Trình độ Tiến sĩ: [điền số lượng/tỷ lệ %]
— Trình độ Thạc sĩ: [điền số lượng/tỷ lệ %]
— Trình độ Đại học/CKI/CKII: [điền số lượng/tỷ lệ %]
— Tỷ lệ sinh viên/giảng viên: [điền số liệu]

Danh sách giảng viên tiêu biểu — xem tại Trang chủ, mục "Đội ngũ giảng viên".

[Phòng Tổ chức — Cán bộ cập nhật số liệu chính thức trước khi công bố]`,
      },
    ]);
    console.log("✓ Tạo 4 trang Công khai mặc định (khung template, cần trường điền số liệu thật)");
  } else {
    console.log("• Đã có trang Công khai, bỏ qua.");
  }

  // Trang Giới thiệu / Liên hệ mặc định — nội dung giới thiệu chung, các
  // mốc thời gian/số liệu cụ thể để placeholder, trường tự điền số liệu thật.
  const existingAboutContact = await db.query.pages.findMany({
    where: (p, { inArray }) => inArray(p.slug, ["gioi-thieu", "lien-he"]),
  });
  if (existingAboutContact.length === 0) {
    await db.insert(pages).values([
      {
        slug: "gioi-thieu",
        title: "Giới thiệu",
        content: `Trường Cao đẳng Y Dược Hợp Lực đào tạo nguồn nhân lực y dược chất lượng cao, gắn lý thuyết với thực hành lâm sàng thực tế ngay từ năm nhất — hợp tác cùng nhiều bệnh viện, nhà thuốc đối tác để sinh viên có môi trường thực hành sát với công việc thật sau khi ra trường.

Sứ mệnh
Đào tạo đội ngũ Điều dưỡng, Dược sĩ, Kỹ thuật viên xét nghiệm và các ngành y tế khác vững chuyên môn, giàu y đức, đáp ứng nhu cầu nhân lực ngành y tế trong nước và khu vực.

Lịch sử hình thành
[Trường điền: năm thành lập, các mốc phát triển quan trọng, quyết định thành lập/nâng cấp trường theo hồ sơ pháp lý chính thức]

Đội ngũ lãnh đạo
[Trường điền: danh sách Ban Giám hiệu — họ tên, chức danh, học hàm/học vị]

Cơ sở vật chất
[Trường điền: quy mô khuôn viên, phòng học, phòng thực hành — chi tiết đầy đủ xem tại /cong-khai/cong-khai-co-so-vat-chat]`,
      },
      {
        slug: "lien-he",
        title: "Liên hệ",
        content: `Đội ngũ tư vấn tuyển sinh của trường luôn sẵn sàng giải đáp thắc mắc về ngành học, hồ sơ xét tuyển và học phí — liên hệ qua hotline, email hoặc đến trực tiếp trường theo thông tin bên dưới.

Giờ làm việc: [Trường điền: VD Thứ 2 - Thứ 6, 7h30 - 17h00]`,
      },
    ]);
    console.log("✓ Tạo trang Giới thiệu, Liên hệ mặc định");
  } else {
    console.log("• Đã có trang Giới thiệu/Liên hệ, bỏ qua.");
  }

  // Trang Chính sách bảo mật — khung tham khảo tinh thần Nghị định 13/2023/NĐ-CP
  // (bảo vệ dữ liệu cá nhân), liệt kê đúng những gì 2 form công khai (Tuyển
  // sinh, Liên hệ) đang thu thập thật. KHÔNG phải văn bản pháp lý chính thức
  // — trường nên rà soát cùng bộ phận pháp lý trước khi xem là hoàn chỉnh.
  const existingPrivacyPage = await db.query.pages.findFirst({
    where: (p, { eq: eqOp }) => eqOp(p.slug, "chinh-sach-bao-mat"),
  });
  if (!existingPrivacyPage) {
    await db.insert(pages).values({
      slug: "chinh-sach-bao-mat",
      title: "Chính sách bảo mật",
      content: `Trường Cao đẳng Y Dược Hợp Lực tôn trọng và cam kết bảo vệ thông tin cá nhân của người truy cập website.

Thông tin thu thập
— Form "Đăng ký xét tuyển" (/tuyen-sinh): họ tên, số điện thoại, số CCCD, email (tuỳ chọn), ngành quan tâm, ghi chú.
— Form "Liên hệ" (/lien-he): họ tên, số điện thoại (tuỳ chọn), email (tuỳ chọn), nội dung câu hỏi.

Mục đích sử dụng
Thông tin trên chỉ dùng để xử lý hồ sơ xét tuyển, tra cứu kết quả (qua số CCCD) và phản hồi câu hỏi của bạn — không dùng cho mục đích quảng cáo, không chia sẻ cho bên thứ ba ngoài phạm vi hoạt động tuyển sinh của trường.

Thời gian lưu trữ
[Trường điền: thời gian lưu trữ hồ sơ theo quy định nội bộ, VD lưu trong suốt khoá học + X năm sau khi tốt nghiệp]

Quyền của bạn
Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xoá thông tin cá nhân đã cung cấp — liên hệ qua hotline/email ở trang Liên hệ để được hỗ trợ.

[Bộ phận phụ trách pháp lý/tuyển sinh rà soát và cập nhật nội dung chính thức trước khi công bố]`,
    });
    console.log("✓ Tạo trang Chính sách bảo mật mặc định");
  } else {
    console.log("• Đã có trang Chính sách bảo mật, bỏ qua.");
  }

  // Mục menu "Công khai" — danh mục to (nằm trong nút ☰, giống site tham khảo) + 4 danh mục con
  const existingCongKhaiNav = await db.query.navItems.findFirst({
    where: (n, { eq }) => eq(n.href, "/cong-khai"),
  });
  if (!existingCongKhaiNav) {
    await db.insert(navItems).values({
      label: "Công khai",
      href: "/cong-khai",
      isPrimary: 0,
      sortOrder: 9,
    });
    const congKhaiParent = await db.query.navItems.findFirst({
      where: (n, { eq }) => eq(n.href, "/cong-khai"),
    });
    if (!congKhaiParent) throw new Error("Không tìm thấy nav item Công khai vừa tạo");

    await db.insert(navItems).values(
      congKhaiSlugs.map((slug, i) => {
        const titles: Record<string, string> = {
          "cong-khai-tai-chinh": "Tài chính",
          "cong-khai-co-so-vat-chat": "Cơ sở vật chất",
          "cong-khai-chuong-trinh-dao-tao": "Chương trình đào tạo",
          "cong-khai-doi-ngu-giang-vien": "Đội ngũ giảng viên",
        };
        return {
          label: titles[slug],
          href: `/cong-khai/${slug}`,
          parentId: congKhaiParent.id,
          sortOrder: i,
        };
      })
    );
    console.log("✓ Tạo mục menu Công khai (danh mục to + 4 danh mục con)");
  } else {
    console.log("• Đã có mục menu Công khai, bỏ qua.");
  }

  // Backfill bản tiếng Anh cho toàn bộ mục menu hiện có (idempotent) — chạy
  // cuối cùng sau khi mọi mục menu (kể cả Công khai, Đội ngũ giảng viên) đã tồn tại.
  const navTranslations: Record<string, string> = {
    "/": "Home",
    "/gioi-thieu": "About",
    "/nganh-dao-tao": "Programs",
    "/tuyen-sinh": "Admissions",
    "/tin-tuc": "News",
    "/lien-he": "Contact",
    "/nganh-dao-tao/dieu-duong": "Nursing",
    "/nganh-dao-tao/duoc": "Pharmacy",
    "/nganh-dao-tao/xet-nghiem-y-hoc": "Medical Laboratory Science",
    "/nganh-dao-tao/ho-sinh": "Midwifery",
    "/nganh-dao-tao/phuc-hoi-chuc-nang": "Physical Therapy & Rehabilitation",
    "/nganh-dao-tao/y-si-da-khoa": "General Medicine Practitioner",
    "/tra-cuu-ket-qua": "Check Results",
    "/thu-vien": "Gallery",
    "/lms": "LMS Portal",
    "/doi-ngu-giang-vien": "Faculty",
    "/cong-khai": "Public Disclosure",
    "/cong-khai/cong-khai-tai-chinh": "Finance",
    "/cong-khai/cong-khai-co-so-vat-chat": "Facilities",
    "/cong-khai/cong-khai-chuong-trinh-dao-tao": "Training Programs",
    "/cong-khai/cong-khai-doi-ngu-giang-vien": "Faculty",
  };
  const allNavRows = await db.query.navItems.findMany();
  for (const row of allNavRows) {
    const labelEn = navTranslations[row.href];
    if (labelEn && !row.labelEn) {
      await db.update(navItems).set({ labelEn }).where(eq(navItems.id, row.id));
    }
  }

  // Nút liên hệ nhanh nổi góc màn hình (admin/lien-he-nhanh) — mặc định lấy
  // hotline/Zalo/Facebook từ Cài đặt chung, cộng thêm 2 mục placeholder
  // (Tin nhắn, ChatbotAI) để trường tự điền link khi sẵn sàng.
  const existingQuickContacts = await db.query.quickContacts.findMany();
  if (existingQuickContacts.length === 0) {
    const s = await db.query.siteSettings.findFirst({ where: (row, { eq }) => eq(row.id, "main") });
    const rows: (typeof quickContacts.$inferInsert)[] = [];
    if (s?.hotline) {
      rows.push({
        type: "hotline",
        label: `Gọi hotline ${s.hotline}`,
        labelEn: `Call hotline ${s.hotline}`,
        href: `tel:${s.hotline.replace(/\s+/g, "")}`,
        sortOrder: 0,
      });
    }
    if (s?.zaloUrl && s.zaloUrl !== "#") {
      rows.push({
        type: "zalo",
        label: "Nhắn tin qua Zalo",
        labelEn: "Message via Zalo",
        href: s.zaloUrl,
        sortOrder: 1,
      });
    }
    if (s?.facebookUrl && s.facebookUrl !== "#") {
      rows.push({
        type: "facebook",
        label: "Nhắn tin qua Facebook",
        labelEn: "Message via Facebook",
        href: s.facebookUrl,
        sortOrder: 2,
      });
    }
    rows.push(
      { type: "message", label: "Tin nhắn", labelEn: "Message", href: "#", sortOrder: 3 },
      { type: "chatbot", label: "ChatbotAI", labelEn: "ChatbotAI", href: "#", sortOrder: 4 }
    );
    await db.insert(quickContacts).values(rows);
    console.log(`✓ Tạo ${rows.length} nút liên hệ nhanh mặc định`);
  } else {
    console.log("• Đã có nút liên hệ nhanh, bỏ qua.");
  }

  console.log("Seed hoàn tất.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
