import type { Metadata } from "next";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getPageBySlug } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/site-settings";
import { ContactForm } from "@/components/site/ContactForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = { title: "Liên hệ" };

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPageBySlug("lien-he"), getSiteSettings()]);

  const socialLinks = [
    { label: "Facebook", href: settings.facebookUrl },
    { label: "Zalo", href: settings.zaloUrl },
    { label: "YouTube", href: settings.youtubeUrl },
  ].filter((s) => s.href && s.href !== "#");

  return (
    <>
    <PageHero
      crumbs={[{ label: "Liên hệ" }]}
      eyebrow="Liên hệ"
      title={page?.title ?? "Liên hệ với Hợp Lực"}
      imageUrl={page?.coverImageUrl}
      description={`Hotline ${settings.hotline} · ${settings.email}`}
    />
    <DecorativeSection contentClassName="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {page?.content ? <MarkdownContent content={page.content} /> : (
            <p className="text-base leading-relaxed text-ink-soft">Gửi câu hỏi qua form bên dưới hoặc liên hệ trực tiếp để được nhà trường hỗ trợ.</p>
          )}

          <div className="mt-10 rounded-2xl border border-line bg-white p-7 shadow-sm2">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Gửi câu hỏi cho nhà trường
            </div>
            <ContactForm />
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-7 shadow-sm2 lg:sticky lg:top-28">
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
    </>
  );
}
