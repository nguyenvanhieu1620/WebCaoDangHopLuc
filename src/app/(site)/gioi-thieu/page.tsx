import type { Metadata } from "next";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageStub } from "@/components/ui/PageStub";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
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
    <DecorativeSection contentClassName="mx-auto max-w-3xl">
        <Eyebrow tone="blue" className="mb-6">
          Giới thiệu
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          {page.title}
        </h1>
        {page.coverImageUrl && (
          <div className="relative mt-8 h-[280px] overflow-hidden rounded-2xl sm:h-[360px]">
            <Image src={page.coverImageUrl} alt={page.title} fill className="object-cover" />
          </div>
        )}
        <MarkdownContent content={page.content} className="mt-8" />
    </DecorativeSection>
  );
}
