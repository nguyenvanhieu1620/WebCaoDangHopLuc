# Khảo sát website bằng Chrome — 01/10/2026

## Cách kiểm tra và phân công

Codex dùng Playwright điều khiển Chrome thật (headless, không phải chỉ gửi HTTP), tại `http://localhost:3000`. Desktop 1440×1000, mobile giả lập viewport 390×844. Có thao tác điền form, bấm nút, đăng nhập, chuyển trang và cập nhật hồ sơ. Mobile là Chrome desktop thu nhỏ, chưa thay thế kiểm tra trên điện thoại thật.

Claude Code 2.1.283 được gọi thực sự qua CLI, công cụ Read/Glob/Grep, exit code 0. Claude đọc hướng dẫn, README, schema, phân quyền, các trang và action liên quan; không thao tác trình duyệt, không sửa mã. Codex đối chiếu nhận xét với mã nguồn và kết quả Chrome. Không sử dụng nhận xét pháp lý hoặc giả thuyết như lỗi đã tái hiện.

Đợt này chỉ khảo sát, lưu ảnh và báo cáo. Không sửa mã chức năng/giao diện. Giữ nguyên các thay đổi đang có trong working tree. Hai đợt thử tạo hồ sơ/liên hệ có tên AUDIT riêng; đã xóa chính xác 4 bản ghi thử, không xóa dữ liệu khác.

## Kết quả thao tác thật

- 11 đường dẫn công khai/đăng nhập: `/`, `/nganh-dao-tao`, `/tuyen-sinh`, `/tra-cuu-ket-qua`, `/lien-he`, `/tin-tuc`, `/thu-vien`, `/lms`, `/faq`, `/cong-khai`, `/admin/dang-nhap`: HTTP 200.
- Đăng nhập bằng bấm nút Chrome thành công, vào dashboard; 8 trang quản trị mở được: dashboard, tuyển sinh, liên hệ, bài viết, media, menu, người dùng, cài đặt.
- Từ chi tiết Điều dưỡng bấm CTA: tới `/tuyen-sinh?nganh=dieu-duong#dang-ky`, ngành được chọn sẵn.
- Gửi hồ sơ qua form: có thông báo thành công; tra cứu thấy đúng hồ sơ vừa gửi; admin nhận hồ sơ. Bấm “Đã liên hệ” trong admin, tra cứu đổi sang “Đã liên hệ trao đổi kết quả”.
- Gửi câu hỏi qua form liên hệ thành công; admin thấy tin nhắn.
- Mật khẩu sai hiện thông báo; sau đó điền lại email/mật khẩu đúng thì đăng nhập được. Phát hiện email bị xóa sau lỗi.
- Mobile: mở menu và chọn Tuyển sinh được. Chuyển EN hoạt động nhưng giao diện còn tiếng Việt.
- Không ghi nhận pageerror JavaScript trong lượt duyệt đầu. Không có tràn ngang toàn trang ở 4 trang mobile đã xem; riêng bảng tuyển sinh bị cắt bên trong container (chi tiết dưới).

Ảnh và dữ liệu kiểm tra nằm trong [browser-audit](browser-audit/). `observations.json` là lần duyệt trang; `flows.json` là thao tác form và cập nhật hồ sơ. Ảnh trang chủ cần cuộn để kích hoạt Reveal; khoảng trống trong ảnh chụp trước cuộn không được coi là mất nội dung.

## Các điểm cần nâng cấp

| Trang/chức năng | Đã có | Còn thiếu / vấn đề | Bằng chứng và file liên quan | Ưu tiên |
|---|---|---|---|---|
| Tuyển sinh trên mobile | Nhận hồ sơ, lọc, cập nhật trạng thái | Không thấy ngành, trạng thái và nút thao tác ở bên phải; không có cuộn ngang dùng được | Chrome: bảng rộng ~879px trong container 324px, `overflow-x: hidden`; ảnh `mobile-table-detail.png`; `src/app/admin/(dashboard)/tuyen-sinh/page.tsx` | P1 |
| Tra cứu “kết quả xét tuyển” | Tra cứu và cập nhật trạng thái liên thông | Chỉ có Mới/Đã xem/Đã liên hệ, chưa có kết quả xét tuyển; tên trang tạo kỳ vọng lớn hơn chức năng | Chrome đã đổi trạng thái và tra cứu lại; `src/lib/db/schema.ts`, `src/app/api/admissions/tra-cuu/route.ts` | P1 |
| Bảo vệ tra cứu hồ sơ | Kiểm tra CCCD, giới hạn tần suất | Chỉ nhập CCCD là thấy họ tên/ngành; nên có mã tra cứu riêng hoặc xác minh bổ sung | Chrome tra cứu hồ sơ thử không cần đăng nhập/yếu tố khác; API tra cứu | P1 |
| Chi tiết hồ sơ tuyển sinh | Admin thấy tên/SĐT/CCCD/ngành | Email, ghi chú và thời điểm nộp đã lưu nhưng không hiện trong bảng; chưa có trang chi tiết, lịch sử xử lý, xuất dữ liệu | Hồ sơ thử có email/note nhưng dòng admin không hiển thị; trang/action tuyển sinh, schema | P1 |
| Form đăng nhập | Lỗi sai mật khẩu và đăng nhập đúng đều hoạt động | Nhập sai mật khẩu làm email bị xóa, phải nhập lại; label chưa gắn input, chưa có bật/tắt hiển thị mật khẩu | `flows.json`: `emailAfterError` rỗng; `src/app/admin/dang-nhap/page.tsx` | P1 |
| Nội dung và độ tin cậy | CMS cho nội dung, chỉ tiêu và thông tin liên hệ | Hero, ảnh bài/giảng viên/gallery còn khung thay thế; liên hệ có “[Trường điền…]”; số liệu/chỉ tiêu, địa chỉ và ưu đãi đang từ seed, chưa xác minh | Ảnh `home.png`, `lien-he.png`; `src/lib/db/seed.ts`, trang chủ và trang tĩnh | P1 trước phát hành |
| LMS | Có trang giải thích chưa cập nhật | Lối tắt trang chủ là `href="#"`; bấm không đưa tới LMS hoặc trang hướng dẫn | Chrome đã bấm và vẫn ở trang chủ; `src/app/(site)/page.tsx`, cấu hình `lmsUrl` | P1 |
| Giới hạn API công khai | Chống spam, không tin header IP tùy ý | Khi chưa cấu hình proxy, mọi người dùng chung bucket `unknown`: tuyển sinh 5 lượt/10 phút, tra cứu 20 lượt/10 phút | Claude chỉ ra, Codex xác nhận trong `src/lib/rate-limit.ts` và hai API; chưa cố ý làm hết quota server | P1 trước public |
| Bản tiếng Anh | Banner và tên ngành có bản dịch | Tiêu đề, nhãn form, nút, footer vẫn tiếng Việt; đơn vị “3 năm” chưa dịch | Chrome bấm EN, ảnh `mobile-en-admissions.png`; các form, Header/Footer và trang tuyển sinh | P2 |
| Cấu trúc điều hướng | Menu desktop/mobile từ CMS | Menu mobile có 14 mục cấp đầu, thiếu nhóm theo nhu cầu thí sinh/sinh viên/giới thiệu; nên ưu tiên Tuyển sinh, Ngành, Học phí, Tra cứu | Ảnh `mobile-menu-open.png`; `src/components/site/SiteHeader.tsx`, `src/lib/data/nav.ts` | P2 |
| Menu bằng bàn phím | Hover chuột mở menu phụ | Focus nút “Danh mục khác” rồi Enter không mở danh sách; các link phụ bị ẩn | Chrome: `keyboardEnterOpens=false`, `mouseHoverOpens=true` trong `extras.json`; `SiteHeader.tsx` dùng `group-hover` | P1 |
| Media/CMS | Upload, danh sách, xóa | Theo mã, tài liệu có thể bị render thành video; xóa media chưa kiểm tra nơi sử dụng. Chưa thử upload/xóa tệp thật | Claude review, Codex đọc: `src/app/admin/(dashboard)/media/page.tsx`, `media/actions.ts` | P1, cần test riêng |
| Phản hồi CMS | Form và action lưu người dùng/bài viết | Theo mã, vài nhánh dữ liệu thiếu/email trùng return im lặng; sửa email trùng có thể lỗi unique; chưa tái hiện tạo tài khoản | `src/app/admin/(dashboard)/nguoi-dung/actions.ts`, `bai-viet/actions.ts` | P1, cần test riêng |

Về giao diện: màu thương hiệu, phân cấp hero và card đã có nền tảng khá nhất quán. Điểm yếu lớn là thiếu ảnh thật, nhiều khối dài và thông tin chưa được tổ chức theo quyết định của thí sinh. Trang tuyển sinh có chỉ tiêu và form nhưng còn thiếu hướng dẫn rõ về học phí, điều kiện, mốc thời gian, giấy tờ và kênh hỗ trợ. Cần nội dung được trường xác nhận, không tự điền dữ kiện mới.

## Ba gói triển khai tiếp theo

### 1. Hoàn thiện tuyển sinh và tra cứu — làm trước

Phạm vi: trang/action quản trị tuyển sinh, hai API tuyển sinh/tra cứu, `AdmissionForm`, `LookupForm`, schema và migration liên quan. Thêm chi tiết hồ sơ, trạng thái xử lý rõ ràng; nếu chưa có nghiệp vụ xét tuyển thì đổi nhãn thành “Tra cứu trạng thái hồ sơ”. Bổ sung mã tra cứu/xác minh, thông tin mục đích xử lý dữ liệu và lựa chọn đồng ý phù hợp; sửa bảng mobile. Rà cấu hình rate limit theo hạ tầng thực tế.

Codex phụ trách schema/API, bảo vệ tra cứu, migration và tích hợp. Claude phụ trách giao diện form, chi tiết hồ sơ và bảng mobile. Làm lần lượt trong cùng thư mục; nếu làm song song phải dùng worktree riêng.

Nghiệm thu: gửi → admin xem đầy đủ → đổi trạng thái → thí sinh tra cứu đúng; sai mã không lộ hồ sơ; mobile 390px xem và cập nhật được; không khóa cả site chỉ vì một người; có test tích hợp và test Chrome hồi quy.

### 2. CMS dễ vận hành và tránh mất nội dung

Phạm vi: đăng nhập, người dùng, bài viết, media và các action tương ứng. Giữ email sau lỗi đăng nhập, label/autocomplete đúng; thông báo lưu thành công/thất bại; xử lý email trùng; xem trước bản nháp có kiểm soát; phân loại tài liệu và kiểm tra media đang sử dụng trước khi xóa.

Claude phụ trách form, thông báo và giao diện preview/media. Codex phụ trách validation, phân quyền, kiểm tra tham chiếu media, kiểm tra hồi quy và tích hợp.

Nghiệm thu: lỗi nhập liệu không gây trang lỗi hoặc mất dữ liệu form; bản nháp không lộ công khai; PDF không hiện thành video; xóa file đang dùng có cảnh báo/biện pháp bảo vệ; kiểm tra desktop/mobile bằng Chrome.

### 3. Hoàn thiện nội dung, điều hướng và hình ảnh

Phạm vi: Header/Footer, trang chủ, tuyển sinh, thư viện, LMS, menu CMS và từ điển giao diện VI/EN. Nhóm menu theo nhu cầu; nối LMS thật hoặc dẫn tới `/lms`; thay placeholder bằng tài sản/nội dung được xác nhận; thêm bảng thông tin tuyển sinh dễ đọc và CTA hỗ trợ. Hoàn thiện bản EN.

Claude phụ trách bố cục và component giao diện theo design tokens. Codex phụ trách dữ liệu CMS, liên kết, nội dung song ngữ, kiểm tra quyền, responsive và tích hợp.

Nghiệm thu: không có link `#` đóng vai trò chức năng; không còn “[Trường điền…]” ở nội dung xuất bản; desktop/mobile và bàn phím dùng được; EN nhất quán. 3D chỉ là lớp nâng cấp nhẹ cho hero/card khi đã có ảnh và nội dung thật; tắt khi reduced-motion, không che CTA/form hay làm chậm thao tác.

## Giới hạn

Chưa kiểm tra điện thoại thật, Safari/Firefox, production HTTPS, email gửi thật, Turnstile có key, tài khoản giới hạn quyền, toàn bộ CRUD hoặc upload/xóa media. Chưa chạy benchmark hiệu năng production; không suy ra tốc độ từ dev server. Không chạy lại build/lint/test vì đợt này không sửa mã ứng dụng.
