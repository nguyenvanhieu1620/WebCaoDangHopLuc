import type { Metadata } from "next";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getPageBySlug } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/site-settings";
import { ContactForm } from "@/components/site/ContactForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { SOCIAL_BG, SocialIcon, socialLinks } from "@/components/ui/SocialIcon";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Liên hệ" };

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPageBySlug("lien-he"), getSiteSettings()]);

  const socials = socialLinks(settings);

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
          {socials.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <div className="mb-3 text-[14.5px] text-ink-faint">Theo dõi nhà trường</div>
              <div className="flex flex-col gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.network}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-line p-2 pr-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md2"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
                        SOCIAL_BG[s.network]
                      )}
                    >
                      <SocialIcon network={s.network} size={s.network === "youtube" ? 21 : 19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-ink">{s.label}</span>
                      <span className="block truncate text-[12px] text-ink-faint">
                        {s.href.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "")}
                      </span>
                    </span>
                    <span aria-hidden className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-700">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
    </DecorativeSection>
    </>
  );
}
