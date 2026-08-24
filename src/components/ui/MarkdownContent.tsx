import ReactMarkdown from "react-markdown";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

/**
 * Hiển thị nội dung Markdown (bài viết, trang tĩnh...) theo đúng token màu/
 * font của hệ thống thiết kế — dùng chung cho mọi nơi có field `content`
 * soạn qua <MarkdownEditor> (src/components/admin/MarkdownEditor.tsx).
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-4 text-[15.5px] leading-relaxed text-ink-soft last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h2 className="mb-3 mt-8 font-display text-2xl font-semibold text-brand-900 first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="mb-3 mt-8 font-display text-xl font-semibold text-brand-900 first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-6 font-display text-lg font-semibold text-ink first:mt-0">
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[15.5px] leading-relaxed text-ink-soft">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[15.5px] leading-relaxed text-ink-soft">
              {children}
            </ol>
          ),
          a: ({ children, href }) => (
            <a href={href} className="font-semibold text-brand-700 underline hover:text-accent-600">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-brand-200 pl-4 italic text-ink-soft">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
