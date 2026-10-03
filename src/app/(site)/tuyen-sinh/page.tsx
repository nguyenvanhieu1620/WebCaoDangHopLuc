import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MoreLink } from "@/components/ui/MoreLink";
import { AdmissionForm } from "@/components/site/AdmissionForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { FaqList } from "@/components/site/FaqList";
import { getFaqs } from "@/lib/data/faqs";
import { Reveal } from "@/components/site/Reveal";
import { TiltCard } from "@/components/site/TiltCard";
import { getPrograms } from "@/lib/data/programs";
import { getAdmissionInfo } from "@/lib/data/admission-info";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = { title: "Tuyển sinh" };

const TEXT = {
  vi: {
    eyebrow: "Tư vấn tuyển sinh",
    title: "Tuyển sinh: mốc thời gian, hồ sơ & đăng ký xét tuyển",
    intro: "Mọi thông tin cần biết trên một trang — đọc nhanh các mốc, chuẩn bị hồ sơ, rồi điền form đăng ký. Đội ngũ tư vấn sẽ liên hệ để hướng dẫn chi tiết.",
    jump: "Đăng ký ngay ↓",
    programs: "ngành đào tạo",
    intake: "tổng chỉ tiêu",
    timeline: "Mốc thời gian tuyển sinh",
    updating: "Đang cập nhật",
    methods: "Phương thức & điều kiện xét tuyển",
    documents: "Hồ sơ cần chuẩn bị",
    documentsNote: "Chuẩn bị sẵn bản sao để nộp nhanh hơn. Cán bộ tuyển sinh sẽ xác nhận lại danh sách khi liên hệ.",
    table: "Chỉ tiêu & học phí theo ngành",
    colProgram: "Ngành",
    colDuration: "Thời gian",
    colIntake: "Chỉ tiêu",
    colTuition: "Học phí",
    contact: "Liên hệ",
    tuitionNote: "Học phí ghi \"Liên hệ\" nghĩa là nhà trường đang cập nhật mức chính thức — gọi hotline hoặc để lại thông tin để được tư vấn.",
    formTitle: "Đăng ký xét tuyển",
    formHint: "Miễn phí · khoảng 2 phút · không cần tài khoản",
    explore: "Tìm & so sánh ngành →",
    exploreTitle: "Chưa chọn được ngành?",
    exploreText: "Tìm theo sở thích và so sánh tối đa 3 ngành trước khi đăng ký.",
    faqEyebrow: "Hỏi đáp",
    faqTitle: "Câu hỏi thường gặp",
    faqText: "Những thắc mắc phổ biến về tuyển sinh, học phí và đào tạo. Chưa thấy câu trả lời? Gọi hotline hoặc để lại thông tin trong form đăng ký.",
    faqAll: "Xem tất cả câu hỏi",
  },
  en: {
    eyebrow: "Admissions",
    title: "Admissions: key dates, documents & application",
    intro: "Everything you need on one page — check the timeline, prepare your documents, then fill in the form. Our admissions team will contact you.",
    jump: "Apply now ↓",
    programs: "programs",
    intake: "total intake",
    timeline: "Admissions timeline",
    updating: "To be announced",
    methods: "Admission methods & eligibility",
    documents: "Documents to prepare",
    documentsNote: "Prepare copies in advance. Our team will confirm the final list when they contact you.",
    table: "Intake & tuition by program",
    colProgram: "Program",
    colDuration: "Duration",
    colIntake: "Intake",
    colTuition: "Tuition",
    contact: "Contact us",
    tuitionNote: "\"Contact us\" means the official tuition is being updated — call our hotline or leave your details for advice.",
    formTitle: "Apply for admission",
    formHint: "Free · about 2 minutes · no account needed",
    explore: "Find & compare programs →",
    exploreTitle: "Not sure which program?",
    exploreText: "Search by interest and compare up to 3 programs before applying.",
    faqEyebrow: "FAQ",
    faqTitle: "Frequently asked questions",
    faqText: "Common questions about admissions, tuition and training. Can't find your answer? Call our hotline or leave your details in the form.",
    faqAll: "See all questions",
  },
};

/** Số câu hỏi hiện sẵn ở cuối trang Tuyển sinh — còn lại xem ở /faq. */
const FAQ_PREVIEW = 6;

function SectionTitle({ children, index }: { children: React.ReactNode; index: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 font-display text-[24px] font-semibold text-brand-900">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 font-mono text-[12px] font-semibold text-white shadow-blue">
        {index}
      </span>
      {children}
    </h2>
  );
}

export default async function AdmissionsPage({ searchParams }: { searchParams: Promise<{ nganh?: string }> }) {
  const [programs, info, locale, faqs] = await Promise.all([getPrograms(), getAdmissionInfo(), getLocale(), getFaqs()]);
  const t = TEXT[locale];
  const { nganh } = await searchParams;
  const selectedProgram = programs.some((program) => program.slug === nganh) ? nganh : "";
  const totalIntake = programs.reduce((sum, p) => sum + p.intake, 0);
  // Đánh số 01, 02… chỉ cho các khối thực sự hiển thị (khối rỗng bị ẩn không chiếm số).
  const visibleSections = [
    info.timeline.length > 0 && "timeline",
    info.methods.length > 0 && "methods",
    info.documents.length > 0 && "documents",
    programs.length > 0 && "table",
  ].filter(Boolean);
  const sectionNo = (key: string) => String(visibleSections.indexOf(key) + 1).padStart(2, "0");

  return (
    <>
    <PageHero crumbs={[{ label: t.eyebrow }]} eyebrow={t.eyebrow} title={t.title} description={t.intro}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
          <span className="font-mono text-[20px] font-semibold text-white">{programs.length}</span>{" "}
          <span className="text-[12.5px] text-white/75">{t.programs}</span>
        </div>
        {totalIntake > 0 && (
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
            <span className="font-mono text-[20px] font-semibold text-accent-400">{totalIntake.toLocaleString("vi-VN")}</span>{" "}
            <span className="text-[12.5px] text-white/75">{t.intake}</span>
          </div>
        )}
        <a href="#dang-ky" className="rounded-2xl bg-gradient-to-br from-accent-600 to-accent-500 px-5 py-3 text-[13px] font-bold text-white shadow-red">
          {t.jump}
        </a>
      </div>
    </PageHero>
    <DecorativeSection contentClassName="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1fr_420px] lg:gap-12">
      <div className="min-w-0">
        {/* Mốc thời gian */}
        {info.timeline.length > 0 && (
          <section aria-labelledby="ts-timeline">
            <SectionTitle index={sectionNo("timeline")}><span id="ts-timeline">{t.timeline}</span></SectionTitle>
            <ol className="relative space-y-4 pl-8 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-brand-500 before:via-brand-700 before:to-accent-500">
              {info.timeline.map((item, i) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-700 font-mono text-[10px] font-semibold text-white shadow-blue">
                    {i + 1}
                  </span>
                  <Reveal delay={i * 70}>
                    <div className="rounded-2xl border border-line bg-white/85 p-5 shadow-sm2 backdrop-blur transition-shadow hover:shadow-md2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-[17px] font-semibold text-ink">{item.title}</h3>
                        <span
                          className={
                            item.meta
                              ? "rounded-full bg-brand-100 px-3 py-1 font-mono text-[11px] font-semibold text-brand-800"
                              : "rounded-full bg-paper-alt px-3 py-1 font-mono text-[11px] font-semibold text-ink-faint"
                          }
                        >
                          {item.meta ?? t.updating}
                        </span>
                      </div>
                      {item.detail && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{item.detail}</p>}
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Phương thức & điều kiện */}
        {info.methods.length > 0 && (
          <section className="mt-14" aria-labelledby="ts-methods">
            <SectionTitle index={sectionNo("methods")}><span id="ts-methods">{t.methods}</span></SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {info.methods.map((m, i) => (
                <Reveal key={m.id} delay={i * 80} className="h-full">
                  <TiltCard className="h-full rounded-2xl border border-white/90 bg-white/75 p-6 shadow-md2 backdrop-blur-md">
                    <div className={i % 2 ? "tilt-pop mb-3 h-1.5 w-10 rounded-full bg-gradient-to-r from-accent-600 to-accent-500" : "tilt-pop mb-3 h-1.5 w-10 rounded-full bg-gradient-to-r from-brand-700 to-brand-500"} />
                    <h3 className="tilt-pop font-display text-[18px] font-semibold text-brand-900">{m.title}</h3>
                    {m.detail && <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{m.detail}</p>}
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Hồ sơ */}
        {info.documents.length > 0 && (
          <section className="mt-14" aria-labelledby="ts-documents">
            <SectionTitle index={sectionNo("documents")}><span id="ts-documents">{t.documents}</span></SectionTitle>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm2">
              <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {info.documents.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 text-[14px] text-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-700 text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>
                      {d.title}
                      {d.detail && <span className="block text-[12.5px] text-ink-faint">{d.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-ink-faint">{t.documentsNote}</p>
            </div>
          </section>
        )}

        {/* Bảng chỉ tiêu & học phí */}
        {programs.length > 0 && (
          <section className="mt-14" aria-labelledby="ts-table">
            <SectionTitle index={sectionNo("table")}><span id="ts-table">{t.table}</span></SectionTitle>
            <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm2">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-line bg-paper-alt text-[11px] uppercase tracking-wider text-ink-faint">
                  <tr>
                    <th className="px-5 py-3 font-semibold">{t.colProgram}</th>
                    <th className="px-5 py-3 font-semibold">{t.colDuration}</th>
                    <th className="px-5 py-3 font-semibold">{t.colIntake}</th>
                    <th className="px-5 py-3 font-semibold">{t.colTuition}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {programs.map((p) => (
                    <tr key={p.slug} className="transition-colors hover:bg-brand-50/60">
                      <td className="px-5 py-3.5 font-medium text-ink">
                        <Link href={`/nganh-dao-tao/${p.slug}`} className="hover:text-brand-700 hover:underline">
                          {p.name}
                        </Link>
                        <span className="ml-2 font-mono text-[10.5px] text-ink-faint">{p.code}</span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft">{p.duration}</td>
                      <td className="px-5 py-3.5 font-mono text-ink-soft">{p.intake}</td>
                      <td className="px-5 py-3.5">
                        {p.tuition ? (
                          <span className="font-semibold text-brand-800">{p.tuition}</span>
                        ) : (
                          <span className="text-ink-faint">{t.contact}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {programs.some((p) => !p.tuition) && <p className="mt-3 text-[12.5px] text-ink-faint">{t.tuitionNote}</p>}
          </section>
        )}
      </div>

      {/* Cột phải: form dính khi cuộn trên desktop */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div id="dang-ky" className="scroll-mt-28 overflow-hidden rounded-[24px] border border-white/90 bg-white/90 shadow-lg2 backdrop-blur-xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-7 py-6 text-white">
            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-accent-500/40 blur-[40px]" />
            <div className="relative font-display text-[22px] font-semibold">{t.formTitle}</div>
            <div className="relative mt-1 text-[12.5px] text-brand-100">{t.formHint}</div>
          </div>
          <div className="p-7">
            <AdmissionForm key={selectedProgram} programs={programs} selectedProgram={selectedProgram} />
          </div>
        </div>

        <Link
          href="/nganh-dao-tao"
          className="group mt-5 flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-white p-3 shadow-sm2 transition-shadow hover:shadow-md2"
        >
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/images/3d/admissions-care.webp"
              alt=""
              fill
              sizes="112px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-brand-900">{t.exploreTitle}</div>
            <div className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{t.exploreText}</div>
            <div className="mt-1 text-[12.5px] font-bold text-brand-700">{t.explore}</div>
          </div>
        </Link>
      </aside>
    </DecorativeSection>

    {/* Câu hỏi thường gặp — kiểu trang tuyển sinh VinUni, lấy từ admin/faq */}
    {faqs.length > 0 && (
      <section className="bg-paper-alt px-6 py-24 sm:px-8" aria-labelledby="ts-faq">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[360px_1fr] lg:gap-14">
          <div>
            <SectionHeading eyebrow={t.faqEyebrow} eyebrowTone="red" title={<span id="ts-faq">{t.faqTitle}</span>} description={t.faqText} align="left" className="mb-6" />
            <Reveal delay={240}>
              <MoreLink href="/faq">{t.faqAll}</MoreLink>
            </Reveal>
          </div>
          <FaqList faqs={faqs.slice(0, FAQ_PREVIEW)} />
        </div>
      </section>
    )}
    </>
  );
}
