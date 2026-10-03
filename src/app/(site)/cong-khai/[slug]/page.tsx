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
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  return { title: page ? page.title : "Công khai" };
}

export default async function CongKhaiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero
        crumbs={[{ label: "Công khai", href: "/cong-khai" }, { label: page.title }]}
        eyebrow="Công khai"
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
