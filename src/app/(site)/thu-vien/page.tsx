import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { Reveal } from "@/components/site/Reveal";
import { getGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = { title: "Thư viện ảnh & video" };

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        <SectionHeading
          eyebrow="Thư viện"
          title="Thư viện ảnh & video"
          description="Hình ảnh, video hoạt động đào tạo và đời sống sinh viên tại trường."
        />

        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có ảnh nào — quản lý qua admin/thu-vien-trang-chu.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={i * 60}>
                <figure className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm2">
                  <div className="relative h-[180px]">
                    <Image src={item.imageUrl} alt={item.caption} fill className="object-cover" />
                  </div>
                  <figcaption className="px-4 py-3 text-[13px] font-semibold text-ink">
                    {item.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
    </DecorativeSection>
  );
}
