import { pageText } from "@/lib/page-copy";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getPageBySlug } from "@/lib/data/pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const copy = pageText(await getLocale());
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  return { title: page ? page.title : copy("Công khai") };
}

export default async function CongKhaiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const copy = pageText(await getLocale());
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero bannerKey="cong-khai"
        crumbs={[{ label: copy("Công khai"), href: "/cong-khai" }, { label: page.title }]}
        eyebrow={copy("Công khai")}
        title={page.title}
        imageUrl={page.coverImageUrl}
        variant="article"
      />
      <DecorativeSection contentClassName="mx-auto max-w-3xl">
        <MarkdownContent content={page.content} />
      </DecorativeSection>
    </>
  );
}
