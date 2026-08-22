import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Eyebrow";
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
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/cong-khai"
          className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:text-accent-600"
        >
          ← Công khai
        </Link>
        <Eyebrow tone="blue" className="mb-6">
          Công khai
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
