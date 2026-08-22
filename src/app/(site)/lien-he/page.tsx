import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageStub } from "@/components/ui/PageStub";
import { getPageBySlug } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Liên hệ" };

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPageBySlug("lien-he"), getSiteSettings()]);

  if (!page) {
    return (
      <PageStub
        eyebrow="Liên hệ"
        title="Liên hệ với Hợp Lực"
        description="Thông tin liên hệ, bản đồ và form gửi câu hỏi tới nhà trường."
      />
    );
  }

  const socialLinks = [
    { label: "Facebook", href: settings.facebookUrl },
    { label: "Zalo", href: settings.zaloUrl },
    { label: "YouTube", href: settings.youtubeUrl },
  ].filter((s) => s.href && s.href !== "#");

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Eyebrow tone="blue" className="mb-6">
            Liên hệ
          </Eyebrow>
          <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
            {page.title}
          </h1>
          <div className="mt-8 whitespace-pre-line text-[15.5px] leading-relaxed text-ink-soft">
            {page.content}
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
              <dd className="mt-0.5 font-semibold text-ink">{settings.hotline}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Email</dt>
              <dd className="mt-0.5 font-semibold text-ink">{settings.email}</dd>
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
      </div>
    </section>
  );
}
