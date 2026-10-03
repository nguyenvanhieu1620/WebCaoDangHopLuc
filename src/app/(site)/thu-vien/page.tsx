import type { Metadata } from "next";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { GalleryMedia } from "@/components/site/GalleryMedia";
import { LightboxGroup, LightboxTrigger } from "@/components/site/Lightbox";
import { getGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = { title: "Thư viện ảnh & video" };

export default async function GalleryPage() {
  const items = await getGalleryItems();
  const lightboxItems = items.map(({ id, imageUrl, caption, videoUrl }) => ({ id, imageUrl, caption, videoUrl }));

  return (
    <>
      <PageHero bannerKey="thu-vien"
        crumbs={[{ label: "Thư viện" }]}
        eyebrow="Thư viện"
        title="Thư viện ảnh & video"
        description="Hình ảnh, video hoạt động đào tạo và đời sống sinh viên tại trường — bấm vào ảnh để xem lớn, video phát ngay trên trang."
      />
      <DecorativeSection contentClassName="mx-auto max-w-[1220px]">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có ảnh nào — quản lý qua admin/thu-vien-trang-chu.
          </div>
        ) : (
          <LightboxGroup items={lightboxItems}>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 4) * 70}>
                  <LightboxTrigger
                    index={i}
                    label={`${item.videoUrl ? "Xem video" : "Xem ảnh"}: ${item.caption}`}
                    className="block w-full cursor-zoom-in overflow-clip rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2"
                  >
                    <GalleryMedia item={item} className="img-reveal img-shine h-[190px]" />
                    <span className="block px-4 py-3 text-[13px] font-semibold text-ink transition-colors group-hover:text-brand-700">
                      {item.caption}
                    </span>
                  </LightboxTrigger>
                </Reveal>
              ))}
            </div>
          </LightboxGroup>
        )}
      </DecorativeSection>
    </>
  );
}
