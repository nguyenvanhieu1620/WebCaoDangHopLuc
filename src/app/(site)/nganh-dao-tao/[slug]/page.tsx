import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageStub } from "@/components/ui/PageStub";
import { getAllProgramSlugs, getProgramBySlug } from "@/lib/data/programs";

export async function generateStaticParams() {
  const slugs = await getAllProgramSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  return { title: program ? program.name : "Ngành đào tạo" };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  return (
    <PageStub
      eyebrow="Ngành đào tạo"
      title={program.name}
      description={program.summary}
    />
  );
}
