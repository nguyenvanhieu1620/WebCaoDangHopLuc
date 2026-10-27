/**
 * Mật khẩu admin mẫu mà `npm run db:seed` tạo trên máy dev (ghi công khai trong CLAUDE.md và
 * từng in trên trang đăng nhập). Chỉ để dùng trên máy dev: production không hiện gợi ý và
 * `loginAction` từ chối mật khẩu này — nếu DB thật lỡ còn tài khoản mẫu (chép DB dev lên VPS),
 * người lạ không đăng nhập được bằng nó.
 */
export const DEMO_ADMIN_EMAIL = "admin@hopluc.edu.vn";
export const DEMO_ADMIN_PASSWORD = "HopLuc@2026";
