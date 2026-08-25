import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageStub } from "@/components/ui/PageStub";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getPageBySlug } from "@/lib/data/pages";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default async function PrivacyPolicyPage() {
  const page = await getPageBySlug("chinh-sach-bao-mat");

  if (!page) {
    return (
      <PageStub
        eyebrow="Chính sách bảo mật"
        title="Chính sách bảo mật thông tin"
        description="Cách nhà trường thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn."
      />
    );
  }

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Eyebrow tone="blue" className="mb-6">
          Chính sách bảo mật
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          {page.title}
        </h1>
        <MarkdownContent content={page.content} className="mt-8" />
      </div>
    </section>
  );
}
