import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageStub } from "@/components/ui/PageStub";
import { getPageBySlug } from "@/lib/data/pages";

export const metadata: Metadata = { title: "Giới thiệu" };

export default async function AboutPage() {
  const page = await getPageBySlug("gioi-thieu");

  if (!page) {
    return (
      <PageStub
        eyebrow="Giới thiệu"
        title="Về Trường Cao đẳng Y Dược Hợp Lực"
        description="Sứ mệnh, lịch sử hình thành, cơ sở vật chất và đội ngũ lãnh đạo nhà trường."
      />
    );
  }

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Eyebrow tone="blue" className="mb-6">
          Giới thiệu
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          {page.title}
        </h1>
        <div className="mt-8 whitespace-pre-line text-[15.5px] leading-relaxed text-ink-soft">
          {page.content}
        </div>
      </div>
    </section>
  );
}
