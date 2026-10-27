import type { Metadata } from "next";
import { PageStub } from "@/components/ui/PageStub";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
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
    <>
      <PageHero useDefaultImage={false} crumbs={[{ label: "Chính sách bảo mật" }]} eyebrow="Chính sách" title={page.title} imageUrl={page.coverImageUrl} />
      <DecorativeSection contentClassName="mx-auto max-w-3xl">
        <MarkdownContent content={page.content} />
      </DecorativeSection>
    </>
  );
}
