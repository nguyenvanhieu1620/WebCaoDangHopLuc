import ReactMarkdown, { type Components } from "react-markdown";
import { Reveal } from "@/components/site/Reveal";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { videoSource, type VideoSource } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
  /**
   * Mỗi đoạn/tiêu đề/danh sách chạy lên khi cuộn tới (kiểu VinUni) — mặc định bật.
   * Tắt cho đoạn trích ngắn trong thẻ (VD mô tả sự kiện có line-clamp) và bản
   * xem trước trong admin.
   */
  reveal?: boolean;
  /** Đoạn chỉ có 1 link video (YouTube / file đã tải lên) → khung phát video. Tắt cho đoạn trích ngắn trong thẻ. */
  media?: boolean;
};

type HastLike = { type?: string; value?: string; tagName?: string; properties?: { href?: unknown }; children?: HastLike[] };

/**
 * Đoạn văn chỉ gồm ĐÚNG 1 link video — dán nguyên link trên 1 dòng riêng (chữ thường) hoặc viết dạng
 * `[tiêu đề](link)` — thì trả nguồn video; đoạn có chữ khác đi kèm vẫn là đoạn văn bình thường.
 */
function paragraphVideo(node: unknown): VideoSource | null {
  const kids = ((node as HastLike | undefined)?.children ?? []).filter((c) => !(c.type === "text" && !c.value?.trim()));
  if (kids.length !== 1) return null;
  const only = kids[0];
  if (only.type === "text") return videoSource(only.value);
  if (only.type === "element" && only.tagName === "a" && typeof only.properties?.href === "string") return videoSource(only.properties.href);
  return null;
}

/**
 * Hiển thị nội dung Markdown (bài viết, trang tĩnh...) theo đúng token màu/
 * font của hệ thống thiết kế — dùng chung cho mọi nơi có field `content`
 * soạn qua <MarkdownEditor> (src/components/admin/MarkdownEditor.tsx).
 *
 * Khi `reveal` bật, mỗi khối cấp 1 được bọc 1 `Reveal` — khoảng cách giữa các
 * khối (mb-*, mt-*, first:/last:) đặt trên LỚP BỌC chứ không đặt trên phần tử
 * bên trong, vì bên trong lớp bọc phần tử nào cũng là "first/last child".
 */
export function MarkdownContent({ content, className, reveal = true, media = true }: MarkdownContentProps) {
  const block = (spacing: string, el: React.ReactNode) =>
    reveal ? <Reveal className={spacing}>{el}</Reveal> : <div className={spacing}>{el}</div>;

  const components: Components = {
    p: ({ node, children }) => {
      const video = media ? paragraphVideo(node) : null;
      if (video) return block("my-6 first:mt-0 last:mb-0", <VideoEmbed source={video} title="Video" />);
      return block("mb-4 last:mb-0", <p className="text-[15.5px] leading-relaxed text-ink-soft">{children}</p>);
    },
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
