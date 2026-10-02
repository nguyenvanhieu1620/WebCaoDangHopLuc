# Đợt cải thiện chức năng và giao diện 01/10/2026

## Kết quả và phân công

Claude Code được gọi thực sự qua CLI: triển khai kiểm tra đầu vào cho bốn API công khai và test helper, sau đó review chéo chỉ đọc các thay đổi Codex. Các lần gọi hoàn tất với mã 0. Codex đối chiếu phản hồi, tích hợp, bổ sung chức năng, sửa vấn đề phát hiện qua review và chạy kiểm tra cuối.

- Dashboard chỉ query/hiển thị dữ liệu thuộc module được cấp quyền; tài khoản đã xoá và quyền sai cấu trúc bị từ chối.
- Đổi mật khẩu vô hiệu phiên/token reset cũ; reset cập nhật có điều kiện để chống dùng lại đồng thời. Action dịch kiểm tra quyền và giới hạn đầu vào/tần suất.
- API từ chối JSON sai, sai kiểu, quá lớn, email/điện thoại/CCCD không hợp lệ và ngành giả. Newsletter không lỗi unique khi gửi email trùng đồng thời.
- Đăng ký từ trang chi tiết chọn sẵn ngành; gửi slug ổn định giữa VI/EN, giữ tương thích payload tên ngành cũ. Thêm nhãn, bàn phím phù hợp và thông báo lỗi/thành công cho các form.
- Form Liên hệ hoạt động kể cả thiếu bản ghi CMS; ẩn liên hệ nhanh chưa có URL. Thanh admin thay tìm kiếm/chuông chưa hoạt động bằng link xem website.
- Thẻ ngành có hiệu ứng chiều sâu CSS perspective theo chuột, tắt trên cảm ứng và giảm chuyển động; không thêm thư viện 3D.
- Build không còn query bảng ngành lúc sinh static params. README và hướng dẫn cập nhật theo code.
- Tin cậy proxy phải được cấu hình rõ; chỉ chọn IP hợp lệ từ số hop tin cậy bên phải XFF. Turnstile không gửi IP unknown, có timeout và kiểm tra lỗi HTTP theo tài liệu Cloudflare.

## File thay đổi

Claude phụ trách ban đầu:

- `src/lib/validate.ts`
- `src/app/api/admissions/route.ts`
- `src/app/api/admissions/tra-cuu/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/newsletter/route.ts`
- `tests/public-validation.test.ts`

Codex tích hợp thêm slug ngành và chèn newsletter bỏ qua xung đột trong hai API trên, đồng thời phụ trách:

- `src/lib/admin-permissions.ts` (mới)
- `src/lib/admin-auth.ts`
- `src/lib/auth.ts`
- `src/lib/actions/auth-actions.ts`
- `src/lib/actions/password-reset-actions.ts`
- `src/lib/translate-actions.ts`
- `src/lib/rate-limit.ts`
- `src/lib/turnstile.ts`
- `src/lib/data/quick-contacts.ts`
- `src/app/admin/(dashboard)/layout.tsx`
- `src/app/admin/(dashboard)/page.tsx`
- `src/app/(site)/lien-he/page.tsx`
- `src/app/(site)/tuyen-sinh/page.tsx`
- `src/app/(site)/nganh-dao-tao/[slug]/page.tsx`
- `src/components/admin/AdminTopbar.tsx`
- `src/components/site/AdmissionForm.tsx`
- `src/components/site/ContactForm.tsx`
- `src/components/site/LookupForm.tsx`
- `src/components/site/NewsletterForm.tsx`
- `src/components/site/ProgramCard.tsx`
- `src/app/globals.css`
- `tests/admin-permissions.test.ts` (mới)
- `tests/auth-tokens.test.ts` (mới)
- `tests/public-api.test.ts` (mới)
- `tests/rate-limit.test.ts` (mới)
- `tests/turnstile.test.ts` (mới)
- `package.json`
- `.env.example`
- `README.md`
- `CLAUDE.md`
- `docs/IMPROVEMENTS-2026-10.md` (báo cáo này)

AGENTS.md chưa được theo dõi trong Git đã tồn tại trước đợt này, không sửa.

## Kiểm tra cuối

- `npm test`: 35/35 test qua. API test gọi trực tiếp route handlers, dùng SQLite trong bộ nhớ với migration của dự án; kiểm tra đăng ký, tra cứu, liên hệ, newsletter, dữ liệu sai và rate limit. Không gọi email/Turnstile thật.
- `npx tsc --noEmit --incremental false`: qua.
- `npm run lint`: qua.
- `npm run build`: qua, 49 route entries; chạy ngoài sandbox để tải Google Fonts.
- `git diff --check`: qua.

Các lỗi môi trường ban đầu đã được xử lý: PowerShell chặn npx.ps1 nên dùng npx.cmd; tsx trong sandbox lỗi thông tin user Windows nên test chạy ngoài sandbox; DB test chuyển sang bộ nhớ để tránh khóa file Windows. Không chạy migration hoặc seed trên DB người dùng.

## Giới hạn và việc còn lại

- Chưa kiểm tra trực quan 3D hoặc E2E trình duyệt. Các test quyền/token kiểm tra logic; chưa thử đăng nhập/reset email thật qua UI.
- Admin cần đăng nhập lại một lần sau cập nhật vì phiên cũ thiếu credentialVersion. Các link reset cũ cũng bị từ chối.
- TRUST_PROXY_HOPS mặc định 0 dẫn đến bucket IP chung; phải cấu hình proxy tin cậy và chặn truy cập trực tiếp origin trước public. Nhiều instance cần rate limit dùng chung. Không coi hosting đã được cấu hình.
- Phone validation hiện hỗ trợ số di động VN 10 chữ số hoặc +84; chưa hỗ trợ số bàn 11 chữ số. Tra cứu vẫn dùng CCCD, chưa bổ sung yếu tố xác minh thứ hai.
- PostgreSQL/S3, cấu hình dịch vụ thật, nội dung/ảnh chính thức, chống xoá media đang được tham chiếu và xuất bản nội dung công khai còn placeholder nằm ngoài đợt này. Chưa tuyên bố sẵn sàng production.

Tham chiếu kỹ thuật: [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
