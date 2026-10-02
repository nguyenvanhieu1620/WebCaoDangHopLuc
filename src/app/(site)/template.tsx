import { ViewTransition } from "react";

/**
 * Hiệu ứng chuyển trang cho toàn bộ web công khai — `template.tsx` được tạo
 * mới ở mỗi lần điều hướng (khác `layout.tsx` giữ nguyên), nên trang cũ "exit"
 * và trang mới "enter" bên trong 1 transition → React gọi View Transitions API
 * của trình duyệt (mờ dần + trượt nhẹ, CSS ở `globals.css` mục "Chuyển trang").
 * Header được neo cố định (`view-transition-name: site-header`) nên không trượt
 * theo. Trình duyệt chưa hỗ trợ thì chuyển trang bình thường, không lỗi.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
