import { SectionHeading } from "./SectionHeading";

type PageStubProps = {
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Khung tạm cho các trang chưa dựng chi tiết nội dung.
 * Giữ đúng bố cục/tông màu hệ thống để xác nhận layout + điều hướng hoạt động đúng,
 * trước khi từng trang được hoàn thiện nội dung thật ở các bước tiếp theo.
 */
export function PageStub({ eyebrow, title, description }: PageStubProps) {
  return (
    <section className="relative overflow-hidden px-8 py-28">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mx-auto w-fit rounded-2xl border border-line bg-white px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink-faint shadow-sm2">
          Trang đang được xây dựng — nội dung chi tiết sẽ hoàn thiện ở bước tiếp theo
        </div>
      </div>
    </section>
  );
}
