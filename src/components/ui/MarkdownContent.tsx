import ReactMarkdown, { type Components } from "react-markdown";
import { Reveal } from "@/components/site/Reveal";

type MarkdownContentProps = {
  content: string;
  className?: string;
  /**
   * Mỗi đoạn/tiêu đề/danh sách chạy lên khi cuộn tới (kiểu VinUni) — mặc định bật.
   * Tắt cho đoạn trích ngắn trong thẻ (VD mô tả sự kiện có line-clamp) và bản
   * xem trước trong admin.
   */
  reveal?: boolean;
};

/**
 * Hiển thị nội dung Markdown (bài viết, trang tĩnh...) theo đúng token màu/
 * font của hệ thống thiết kế — dùng chung cho mọi nơi có field `content`
 * soạn qua <MarkdownEditor> (src/components/admin/MarkdownEditor.tsx).
 *
 * Khi `reveal` bật, mỗi khối cấp 1 được bọc 1 `Reveal` — khoảng cách giữa các
 * khối (mb-*, mt-*, first:/last:) đặt trên LỚP BỌC chứ không đặt trên phần tử
 * bên trong, vì bên trong lớp bọc phần tử nào cũng là "first/last child".
 */
export function MarkdownContent({ content, className, reveal = true }: MarkdownContentProps) {
  const block = (spacing: string, el: React.ReactNode) =>
    reveal ? <Reveal className={spacing}>{el}</Reveal> : <div className={spacing}>{el}</div>;

  const components: Components = {
    p: ({ children }) => block("mb-4 last:mb-0", <p className="text-[15.5px] leading-relaxed text-ink-soft">{children}</p>),
    h1: ({ children }) =>
      block("mb-3 mt-8 first:mt-0", <h2 className="font-display text-2xl font-semibold text-brand-900">{children}</h2>),
    h2: ({ children }) =>
      block("mb-3 mt-8 first:mt-0", <h3 className="font-display text-xl font-semibold text-brand-900">{children}</h3>),
    h3: ({ children }) =>
      block("mb-2 mt-6 first:mt-0", <h4 className="font-display text-lg font-semibold text-ink">{children}</h4>),
    ul: ({ children }) =>
      block(
        "mb-4 last:mb-0",
        <ul className="list-disc space-y-1.5 pl-5 text-[15.5px] leading-relaxed text-ink-soft">{children}</ul>
      ),
    ol: ({ children }) =>
      block(
        "mb-4 last:mb-0",
        <ol className="list-decimal space-y-1.5 pl-5 text-[15.5px] leading-relaxed text-ink-soft">{children}</ol>
      ),
    a: ({ children, href }) => (
      <a href={href} className="font-semibold text-brand-700 underline hover:text-accent-600">
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
    blockquote: ({ children }) =>
      block("mb-4 last:mb-0", <blockquote className="border-l-4 border-brand-200 pl-4 italic text-ink-soft">{children}</blockquote>),
  };

  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
