import type { Metadata } from "next";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getPageBySlug } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/site-settings";
import { ContactForm } from "@/components/site/ContactForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";

export const metadata: Metadata = { title: "Liên hệ" };

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPageBySlug("lien-he"), getSiteSettings()]);

  const socialLinks = [
    { label: "Facebook", href: settings.facebookUrl },
    { label: "Zalo", href: settings.zaloUrl },
    { label: "YouTube", href: settings.youtubeUrl },
  ].filter((s) => s.href && s.href !== "#");

  return (
    <DecorativeSection contentClassName="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Eyebrow tone="blue" className="mb-6">
            Liên hệ
          </Eyebrow>
          <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
            {page?.title ?? "Liên hệ với Hợp Lực"}
          </h1>
          {page?.coverImageUrl && (
            <div className="relative mt-8 h-[240px] overflow-hidden rounded-2xl sm:h-[300px]">
              <Image src={page.coverImageUrl} alt={page.title} fill className="object-cover" />
            </div>
          )}
          {page?.content ? <MarkdownContent content={page.content} className="mt-8" /> : (
            <p className="mt-6 text-base leading-relaxed text-ink-soft">Gửi câu hỏi qua form bên dưới hoặc liên hệ trực tiếp để được nhà trường hỗ trợ.</p>
          )}

          <div className="mt-10 rounded-2xl border border-line bg-white p-7 shadow-sm2">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Gửi câu hỏi cho nhà trường
            </div>
            <ContactForm />
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-7 shadow-sm2">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            Thông tin liên hệ
          </div>
          <dl className="space-y-4 text-[14.5px]">
            <div>
              <dt className="text-ink-faint">Địa chỉ</dt>
              <dd className="mt-0.5 font-semibold text-ink">{settings.address}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Hotline</dt>
              <dd className="mt-0.5 font-semibold text-ink"><a href={`tel:${settings.hotline.replace(/\s+/g, "")}`} className="hover:text-brand-700">{settings.hotline}</a></dd>
            </div>
            <div>
              <dt className="text-ink-faint">Email</dt>
              <dd className="mt-0.5 font-semibold text-ink"><a href={`mailto:${settings.email}`} className="break-all hover:text-brand-700">{settings.email}</a></dd>
            </div>
          </dl>
          {socialLinks.length > 0 && (
            <div className="mt-6 flex gap-2.5 border-t border-line pt-5">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-brand-700 hover:border-brand-500"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
    </DecorativeSection>
  );
}
