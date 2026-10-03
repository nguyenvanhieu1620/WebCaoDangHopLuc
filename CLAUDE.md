# CLAUDE.md — Bối cảnh dự án (đọc trước khi làm bất cứ việc gì)

> File này tổng hợp lại toàn bộ quá trình trao đổi, quyết định kiến trúc, và
> định hướng của dự án — được viết ra để một phiên Claude Code mới có thể đọc
> và nắm bối cảnh đầy đủ mà không cần người dùng giải thích lại từ đầu.

---

## 1. Dự án là gì

Website chính thức cho **Trường Cao đẳng Y Dược Hợp Lực** (Medical Pharmacy
College), gồm 2 phần:
1. **Website thông tin công khai** — giới thiệu trường, ngành đào tạo, tuyển
   sinh, tin tức...
2. **Trang quản trị (CMS)** — để trường tự đăng bài, quản lý nội dung, xem hồ
   sơ đăng ký tuyển sinh, **không cần biết lập trình**.

Người phát triển là **1 người** (không phải đội ngũ), nên mọi quyết định kiến
trúc đều ưu tiên: **đơn giản, ít phụ thuộc, dễ tự vận hành một mình.**

---

## 2. Lộ trình / Giai đoạn (theo tài liệu SRS đã chốt)

Dự án ban đầu có SRS đầy đủ cho một hệ thống lớn (Website + Quản lý đào tạo +
Điểm số + Học phí + LMS riêng), nhưng đã **chốt lại phạm vi làm theo 2 giai
đoạn** để tránh ôm đồm:

| Giai đoạn | Phạm vi | Trạng thái |
|---|---|---|
| **Giai đoạn 1** | Website thông tin trường + Trang quản trị (CMS) + Liên kết tạm thời sang **LMS VNPT** (hệ thống đào tạo trường đang thuê ngoài) | ⬅️ **Đang làm — repo này** |
| **Giai đoạn 2** | Tự xây: Quản lý đào tạo, Điểm số, Học phí, LMS riêng — thay thế dần LMS VNPT | Tương lai, chưa bắt đầu |

**Quan trọng:** Kiến trúc Giai đoạn 1 phải để ngỏ khả năng bổ sung Giai đoạn 2
sau này **mà không phải viết lại từ đầu** — đây là lý do đằng sau nhiều quyết
định kỹ thuật ở mục 4 bên dưới (lớp `lib/data/`, schema DB portable...).

Ban đầu định triển khai trên AWS theo đúng SRS (Lambda/Fargate + Aurora
PostgreSQL + Cognito + S3), nhưng vì 1 người tự làm, đã quyết định: **làm
xong hết chức năng bằng công nghệ nhẹ (local) trước, khi web hoàn thiện mới
chuyển hạ tầng lên production** (xem mục 4.3).

---

## 3. Hệ thống thiết kế (Design System)

Thiết kế UI/UX ban đầu làm ở **Claude Design** (công cụ riêng của Anthropic),
xuất ra 21 trang dạng `.dc.html` — các file này **không chạy được ngoài môi
trường Claude Design** (cần runtime JSX đặc thù), nhưng đã được dùng làm
**tài liệu tham chiếu** để code lại bằng Next.js thật.

### Màu thương hiệu (trích xuất từ logo chính thức của trường)
- Xanh dương chủ đạo: `#0B6CB0` (đậm `#06325A` → nhạt `#1E9AD6`)
- Đỏ nhấn/CTA: `#C41E24` → gradient cam `#E8562F`
- Nền: trắng xanh mát `#F7F9FB`, nền phụ `#EAF0F5`
- Chữ: `#0F1E29` (đậm), `#4C5E6B` (nhạt)
- Toàn bộ đã khai báo thành token trong `tailwind.config.ts` (`brand-*`, `accent-*`, `paper`, `ink-*`) — **luôn dùng token này, không hard-code mã màu mới.**

### Font
- **Đổi 02/10/2026: toàn site dùng 1 font Montserrat** (giống VinUni, bản variable
  + italic, có tiếng Việt — `src/app/layout.tsx`). 3 token Tailwind `font-display`
  (tiêu đề), `font-sans` (nội dung), `font-mono` (nhãn in hoa/số liệu, có
  `tabular-nums`) giờ đều trỏ Montserrat — giữ tên token để không sửa hàng trăm class.
- Montserrat RỘNG hơn font cũ: header đã chỉnh để không tràn ở 360px (logo co,
  tagline cắt "…") và menu không xuống 2 dòng ở 1024–1279px (chữ/khoảng cách nhỏ
  hơn, nút "Đăng ký xét tuyển" trên header chỉ hiện từ `xl`). Thêm mục menu mới thì
  kiểm tra lại khổ 1024px. Cũng đã chỉnh vì font rộng: nút chính `MobileActionBar`
  (`whitespace-nowrap`, chữ nhỏ hơn dưới 400px), Công cụ nhanh dưới banner (mobile:
  icon trên chữ dưới), nút CTA khối Tuyển sinh cuối Trang chủ, nút ở cột phải chi
  tiết ngành (nhãn ngắn "Đăng ký xét tuyển →"), nhãn chuyên mục tin `whitespace-nowrap`.
- **Kiểm thử 03/10/2026** trước commit: `npm run build` chạy được (lần đầu trong môi
  trường này) + `next start` thử bản production: 25 trang công khai/404 đúng, 96 lượt
  quét tràn ngang (4 khổ) sạch, không lỗi React/CSP, tương tác (banner, slider kéo
  chuột, lightbox, tìm kiếm, cột mốc bàn phím, menu mobile, EN), 25 trang admin + 2
  file CSV, lưu Cài đặt giữ ảnh banner, gửi thật form Liên hệ → admin thấy → đã xoá.
- (Trước đây: Fraunces cho tiêu đề, Inter cho nội dung, IBM Plex Mono cho nhãn.)

### Phong cách — người dùng yêu cầu rõ: **"xịn xò, cầu kỳ", không phẳng/tối giản**
- Glassmorphism cho card nổi (backdrop-blur, nền trắng bán trong suốt)
- Gradient mesh blur trang trí phía sau các khối lớn (hero, CTA band)
- Shadow nhiều lớp, card có `hover:-translate-y` + đổ bóng khi hover
- Bento-grid cho phần gallery
- Card ngành đào tạo: banner gradient màu xen kẽ xanh/navy/đỏ, có họa tiết chấm

### Logo
- File gốc: `public/images/logo-icon.png`, `logo-full.png`
- Lưu ý đã xử lý: file gốc có nền trắng đặc (không trong suốt) → đã dùng
  PIL xoá nền trắng thành alpha trong suốt trước khi đưa vào project.

### Trang chủ đã dựng đầy đủ theo phong cách trên
→ Xem `src/app/(site)/page.tsx` làm **chuẩn tham chiếu** khi dựng các trang còn lại.

---

## 4. Kiến trúc kỹ thuật & lý do lựa chọn

### 4.1 Stack
- **Next.js 16.3.1** (App Router, Turbopack) + **React 19.2** + TypeScript
- **Tailwind CSS 3** — design tokens tập trung ở `tailwind.config.ts`
- **Drizzle ORM** + **SQLite** (qua driver `@libsql/client`)
- Auth tự viết: **bcryptjs** (hash mật khẩu) + session cookie tự ký bằng HMAC (`node:crypto`)
- **react-markdown** — render nội dung Markdown (bài viết/trang tĩnh) an toàn, không dùng `dangerouslySetInnerHTML` (xem mục 5 "Admin dễ dùng hơn")

### 4.1b Các bảng DB hiện tại (`src/lib/db/schema.ts`) — 23 bảng
`admin_users`, `posts` (có thêm `category_id`, `cover_image_url`), `pages`
(có thêm `cover_image_url` — trang tĩnh giờ cũng thêm ảnh được, không chỉ
text), `media_items` (giờ dùng thật — xem 4.1c), `admission_submissions`,
`programs`, `site_settings` (đơn dòng, id `"main"`), `homepage_content`
(đơn dòng, id `"main"`, có `hero_image_url` + 2 badge nổi
`hero_badge1/2_value/label`) — nhóm bảng gốc/Giai đoạn 1a. Thêm ở đợt dựng
lại Trang chủ theo thiết kế mới: `categories` (danh mục bài viết),
`partners`, `gallery_items`, `faculty` (có `slug`, `bio`, `departmentId`,
`degree`, `academicRank` — xem mục 5 "Cấu trúc lại Giảng viên"; `education`
cũ không dùng nữa), `testimonials` — các bảng có thứ tự hiển thị đều có cột
`sort_order` (admin tự nhập số để sắp vị trí hiển thị, không làm kéo-thả).
Thêm ở đợt làm menu cha/con: `nav_items` (`parent_id` tự trỏ tới
`nav_items.id` khác — null = danh mục to, có giá trị = danh mục con;
`is_primary` chỉ áp dụng cho danh mục to: 1 = hiện ở thanh ngang chính,
0 = nằm trong nút ☰ "Danh mục khác" — xem `src/lib/data/nav.ts`). Thêm ở
đợt mở rộng tính năng (không chỉ tuyển sinh): `events` (Sự kiện),
`contact_messages` (tin nhắn từ form Liên hệ thật), `faqs` (Câu hỏi thường
gặp), `hero_banners` (banner Trang chủ nhiều ảnh — xem mục 5 "Banner Trang
chủ nhiều ảnh + nút liên hệ nhanh nổi"), `departments` (Khoa/Bộ môn),
`faculty_attributes` (Học hàm/Học vị/Chức vụ — xem mục 5 "Sidebar admin
theo khối thực thể"). Thêm ở đợt tách nút liên hệ nhanh khỏi
`site_settings`: `quick_contacts` (xem mục 5 "Nút liên hệ nhanh quản lý
qua admin"). Thêm ở đợt đối chiếu với website trường khác: bảng mới
`newsletter_subscribers`, cột `gallery_items.video_url` và
`posts.is_pinned` (xem mục 5 "3 nâng cấp sau khi đối chiếu với website
trường khác"). Thêm ở đợt đánh giá thiết kế lần 2: cột
`posts.attachment_url`/`posts.attachment_name` (tệp đính kèm), `type` của
`media_items` giờ có thêm giá trị `"document"` ngoài `"image"`/`"video"`
(xem mục 5 "Đánh giá thiết kế web + admin lần 2 + tệp đính kèm cho Bài
viết"). Thêm ở đợt "pro hơn + 3D" (migration `0015_bitter_longshot.sql`):
bảng mới `admission_items` (mốc thời gian/phương thức/hồ sơ tuyển sinh), cột
`programs.tuition`/`tuition_en` và `nav_items.description`/`description_en`
(xem mục 5 "Đợt pro hơn + 3D"). Thêm ở đợt tham khảo VinUni (migration
`0016_massive_guardsmen.sql`): cột `partners.logo_url`/`partners.website_url`
(đều nullable, xem mục 5 "Đợt tham khảo VinUni"). Thêm ở đợt VinUni lượt 2
(migration `0017_rich_wolfpack.sql`): bảng mới **`milestones`** (Cột mốc —
dòng thời gian /gioi-thieu, có `*_en`) và cột `site_settings.page_banner_url`
(ảnh nền mặc định cho banner trang con) — tổng cộng giờ là **24 bảng**. Migration
`0018_jittery_crusher_hogan.sql`: cột `programs.image_url` (ảnh ngành, nullable — xem
mục 5 "Ảnh cho ngành đào tạo"). Migration `0019_fuzzy_lady_ursula.sql`: bảng mới
**`page_banners`** (`key` = mã trang con, `image_url`) — giờ là **25 bảng** (xem mục 5
"Banner riêng từng trang con").

**Cột `*_en` (đa ngôn ngữ, xem mục 5 "Đa ngôn ngữ tiếng Anh")**: hầu hết
bảng có nội dung hiển thị công khai đều có thêm 1-3 cột `*_en` song song
(VD `name`/`name_en`, `content`/`content_en`) — nullable, không có DEFAULT.
Đây **không phải bảng mới**, chỉ là cột thêm vào bảng cũ qua migration
`0003_messy_bishop.sql`. Khi thêm bảng/cột nội dung công khai mới, cân nhắc
luôn thêm cột `*_en` cùng lúc theo đúng pattern này thay vì thêm sau.

### 4.1c Upload ảnh/video thật (`src/lib/media.ts`)
`saveUploadedFile(file)` — ghi file vào `public/uploads/` (tên file thêm
tiền tố `Date.now()-` để tránh trùng) + insert 1 dòng `media_items`. Mọi
form cần ảnh trong admin (Trang chủ hero, Bài viết cover, Đối tác không cần
ảnh, Giảng viên, Đánh giá, Thư viện Trang chủ) đều gọi hàm này trực tiếp
trong Server Action của form đó — **không** có bước "chọn từ thư viện có
sẵn" riêng, upload xong dùng luôn (giữ đúng triết lý server-first, ít state
client). Ảnh vẫn xuất hiện trong `admin/media` vì cùng ghi vào
`media_items`. Xoá 1 mục trong Trang tĩnh/Giảng viên/Đánh giá/Gallery
**không** xoá file vật lý hay dòng `media_items` tương ứng (giống WordPress
— thư viện media độc lập với nơi đang dùng ảnh) — muốn xoá hẳn file thì vào
`admin/media` xoá trực tiếp.

### 4.2 Vì sao chọn từng thứ (để không đổi lại vô tình)

| Quyết định | Lý do |
|---|---|
| Next.js 16 (không phải 14) | Next 14 có 5 lỗ hổng bảo mật mức cao chưa được vá ở bản đó; 16 là bản stable mới nhất tại thời điểm làm (không phải canary) |
| Drizzle ORM (không phải Prisma) | Prisma cần tải engine binary từ `binaries.prisma.sh` — domain này **bị chặn trong sandbox lúc code** (không phải máy thật), nhưng để tránh rủi ro tương tự trên các môi trường CI/hosting bị hạn chế mạng, đã chuyển hẳn sang Drizzle (không cần binary riêng) |
| `@libsql/client` (không phải `better-sqlite3`) | `better-sqlite3` cần biên dịch native qua `node-gyp`, **bắt buộc phải có Python cài sẵn** — đã thực tế gặp lỗi cài đặt trên máy Windows của người dùng vì không có Python. `@libsql/client` dùng binary dựng sẵn theo từng hệ điều hành (napi-rs, kiểu giống `esbuild`/`sharp`), cài qua `npm install` bình thường, không cần biên dịch |
| `db:migrate` (không phải `drizzle-kit push`) | `push` có **bug thật** với driver libsql: chạy lại lần 2 trên DB đã tồn tại báo lỗi `index already exists` (đã tái hiện được lỗi — kể cả khi chỉ thêm bảng mới, không đụng bảng cũ). Chuyển sang workflow migration có version (`db:generate` sinh SQL vào `./drizzle`, `db:migrate` chạy `src/lib/db/migrate.ts` áp dụng, tự lưu vào bảng `__drizzle_migrations`) — an toàn tuyệt đối khi chạy lại nhiều lần. **Lưu ý lịch sử:** quyết định này từng chỉ được ghi ở đây nhưng `package.json` còn thiếu script thật (`db:push` là script duy nhất tồn tại) — đã bổ sung đủ `db:generate`/`db:migrate` + xoá `db:push` để tài liệu khớp với code |
| `src/proxy.ts` (không phải `middleware.ts`) | Next.js 16 đổi tên quy ước file — `middleware.ts` không còn dùng được, phải là `proxy.ts`. Đã dùng codemod chính thức `npx @next/codemod middleware-to-proxy` để chuyển. **Lưu ý:** Proxy trong Next 16 **luôn chạy Node.js runtime mặc định** — không được khai báo `export const config = { runtime: "nodejs" }` (sẽ lỗi build vì dư thừa) |
| `params` là `Promise` trong route động | Next.js 15+ đổi `params`/`searchParams` trong page/layout thành `Promise` — phải `await params` trước khi dùng (khác hẳn Next 14 trở về trước) |
| Session tự viết (không phải NextAuth/Cognito) | Chỉ có 1 quản trị viên, không cần OAuth/nhiều vai trò phức tạp — bcrypt + cookie tự ký là đủ và ít phụ thuộc. Khi cần phức tạp hơn, chỉ sửa `lib/auth.ts` + `proxy.ts`, không ảnh hưởng chỗ khác |

### 4.3 Nguyên tắc để Giai đoạn 2 (SRS) không phải viết lại

1. **Lớp truy xuất dữ liệu** (`src/lib/data/*.ts`): page/component **không bao giờ** đọc thẳng từ `constants.ts` hay gọi `db` trực tiếp — luôn qua hàm `async` ở đây. Khi đổi nguồn dữ liệu (API khác, thêm bảng mới cho Giai đoạn 2), chỉ sửa đúng 1 file.
2. **Schema DB portable sang PostgreSQL**: `src/lib/db/schema.ts` chỉ dùng kiểu dữ liệu chuẩn (text, integer...), không dùng tính năng riêng của SQLite. Khi chuyển Aurora/Neon/Supabase (PostgreSQL), theo đúng 3 bước ghi trong comment đầu file `client.ts` — không cần sửa các trang gọi `db.select()/.insert()`.
3. **Route group tách bạch**: `(site)` cho web công khai, `admin/(dashboard)` cho khu quản trị (có sidebar, bắt buộc đăng nhập), `admin/dang-nhap` đứng riêng (không sidebar). Giai đoạn 2 có thể thêm route group mới (VD: `(student-portal)`, `(teacher-portal)`) theo đúng khuôn này.
4. **Design tokens tập trung**: mọi màu/font Giai đoạn 2 dùng lại token đã có trong `tailwind.config.ts`, không tạo bảng màu mới.

### 4.4 Kế hoạch DB cho tương lai (đã thống nhất với người dùng)

- **Bây giờ → xong hết các trang**: tiếp tục SQLite (`@libsql/client`), không cần cài gì thêm, không cần tài khoản cloud.
- **Khi web hoàn thiện, chuẩn bị đưa lên mạng cho người dùng thật**: bắt buộc chuyển sang **PostgreSQL** (SQLite file-based không hợp production — ghi đồng thời hạn chế, không đồng bộ được giữa nhiều server khi scale). Lúc đó chọn 1 trong 2:
  - **Neon/Supabase** (PostgreSQL miễn phí, nhanh gọn, không cần AWS trước) — khuyến nghị nếu muốn lên mạng sớm.
  - **Amazon RDS Aurora PostgreSQL** — đúng kiến trúc dài hạn trong SRS gốc, cần tài khoản AWS.
  - Cả 2 đều là PostgreSQL nên nếu chọn Neon trước, sau này chuyển tiếp lên Aurora vẫn dễ.

---

## 5. Trạng thái hiện tại

### Đã xong, dùng được thật (không phải giao diện giả)
- Trang chủ (`(site)/page.tsx`) — **dựng lại hoàn toàn theo bộ thiết kế Claude Design mới** (`Home.dc.html`, khác bản đầu) — 11 section: Hero (ảnh + 2 badge nổi) → Đối tác → 4 chỉ số → 3 điểm mạnh → 6 ngành đào tạo → 4 bước quy trình → Thư viện bento 5 ảnh → Đội ngũ giảng viên → Đánh giá cựu SV → Tin tức (3 bài mới nhất) → CTA. Toàn bộ nội dung lấy từ DB, **không hard-code**. Khi admin chưa upload ảnh, dùng `<ImagePlaceholder>` (gradient + nhãn) — không vỡ layout, không hiện icon ảnh lỗi
- Đăng nhập/đăng xuất admin thật (Server Action, session cookie, bcrypt)
- `src/proxy.ts` chặn truy cập `/admin/*` nếu chưa đăng nhập — **đã test bằng Playwright**: chặn khi chưa login ✓, login redirect đúng ✓, logout ✓, chặn lại sau logout ✓
- Dashboard admin — số liệu thật từ DB (đếm bài viết, hồ sơ mới)
- Quản lý bài viết (`admin/bai-viet`) — tạo/xoá/đăng-gỡ, sinh slug tự động tránh trùng, **có Danh mục** (bảng `categories`, admin tự thêm/xoá ngay trong trang, gán qua dropdown) + **ảnh đại diện** (upload thật) — **đã test qua trình duyệt thật**: tạo bài có danh mục → hiện đúng trên Trang chủ
- Quản lý ngành đào tạo (`admin/nganh-dao-tao`) — CRUD đầy đủ (thêm/sửa/xoá/toggle featured), thay thế hẳn mảng tĩnh `PROGRAMS` — **đã test qua trình duyệt thật**: sửa 1 ngành → Trang chủ cập nhật ngay
- Đối tác / Giảng viên / Đánh giá cựu SV / Thư viện ảnh Trang chủ (`admin/doi-tac`, `admin/giang-vien`, `admin/danh-gia`, `admin/thu-vien-trang-chu`) — CRUD đầy đủ, có upload ảnh thật + ô "Vị trí" (số nhỏ hiện trước) — **đã test qua trình duyệt thật** từng trang: thêm/sửa vị trí/xoá, xác nhận Trang chủ cập nhật đúng thứ tự và đúng ảnh
- **Thư viện media** (`admin/media`) — upload thật (kéo/chọn nhiều file, lưu `public/uploads/`), lọc Ảnh/Video, xoá (xoá cả file vật lý) — **đã test qua trình duyệt thật** bằng file thật (tạo `File`/`DataTransfer` qua JS vì công cụ trình duyệt test không có picker OS)
- Cài đặt chung (`admin/cai-dat`) — sửa hotline/email/địa chỉ/banner thông báo/mạng xã hội, áp dụng ngay cho Header + Footer toàn site — **đã test qua trình duyệt thật**
- Nội dung Trang chủ (`admin/trang-chu`) — sửa toàn bộ chữ + ảnh Hero, 2 badge nổi, 4 chỉ số, 3 điểm mạnh, 4 bước quy trình, CTA band (số lượng mục cố định, chỉ sửa nội dung) — **đã test qua trình duyệt thật**
- Trang tĩnh (`admin/trang-tinh`) — CRUD đầy đủ cho bảng `pages` (thêm/sửa/xoá), có **ảnh banner tuỳ chọn** (`coverImageUrl`, qua `ImagePicker` — trước đây trang tĩnh chỉ sửa được text, người dùng phản hồi cần thêm ảnh giống các trang khác nên đã bổ sung) — **đã test qua trình duyệt thật**. Đã nối hiển thị ra `/gioi-thieu`, `/lien-he`, `/cong-khai/*` (xem ghi chú bên dưới)
- **Trang "Công khai"** (`/cong-khai` + `/cong-khai/[slug]`) — mục lục + trang chi tiết đọc từ bảng `pages` (slug `cong-khai-*`) qua `getPageBySlug()`/`getPagesBySlugPrefix()` (`src/lib/data/pages.ts`) — **trang tĩnh ĐẦU TIÊN đã nối hiển thị thật ra web công khai**. Theo tham khảo `cyt.edu.vn` (Cao đẳng Y tế Thanh Hóa) — các trường GDNN thường phải công khai tài chính/cơ sở vật chất/chương trình đào tạo/đội ngũ giảng viên theo Thông tư 36/2017 ("3 công khai"). **Nội dung seed hiện là khung template với placeholder `[điền ...]`, KHÔNG phải số liệu thật** — phải xác nhận với nhà trường có bắt buộc áp dụng không, rồi vào `admin/trang-tinh` điền số liệu thật trước khi công bố chính thức. Đã gắn vào `admin/menu` (danh mục to "Công khai" trong nút ☰ + 4 danh mục con)
- **Menu chính** (`admin/menu`) — CRUD danh mục to/con cho menu điều hướng (`SiteHeader.tsx`), thay hẳn mảng tĩnh `SITE_NAV`. Danh mục to có con → desktop hover hiện dropdown con; danh mục to đánh dấu không phải "menu chính" gom vào 1 nút ☰ riêng cạnh thanh ngang (khác hamburger mobile). Mobile: 1 danh sách phẳng, mục có con bấm mở rộng thụt vào. Xoá 1 danh mục to sẽ xoá cascade toàn bộ con của nó — **đã test qua trình duyệt thật**: sửa/xoá danh mục con → Trang chủ cập nhật đúng dropdown; xoá danh mục to có con → con biến mất theo
- **Tuyển sinh** (`/tuyen-sinh`) — form đăng ký thật (client component `AdmissionForm`, POST tới `/api/admissions`) + bảng chỉ tiêu theo ngành lấy từ `getPrograms()`. Form thu thêm **CCCD** (bắt buộc) làm khoá tra cứu sau này
- **Tra cứu kết quả** (`/tra-cuu-ket-qua`) — client component `LookupForm`, POST tới `/api/admissions/tra-cuu` (route mới) tra theo CCCD, chỉ trả họ tên/ngành/trạng thái/ngày đăng ký (**không trả SĐT/email** — hạn chế lộ thông tin qua tra cứu công khai)
- **Thư viện** (`/thu-vien`) — lưới ảnh đầy đủ từ `getGalleryItems()` (cùng bảng `gallery_items` dùng cho bento Trang chủ, không giới hạn 5 ảnh ở đây)
- **LMS** (`/lms`) — trang hướng dẫn + nút link tới `site_settings.lmsUrl` (cột mới, quản lý qua `admin/cai-dat`); chưa cấu hình thì tự hiện thông báo "chưa cập nhật" thay vì nút link hỏng
- Quản lý tuyển sinh (`admin/tuyen-sinh`) — danh sách hồ sơ (có cột CCCD), đổi trạng thái (Mới/Đã xem/Đã liên hệ)
- API `/api/admissions` — nhận form đăng ký tuyển sinh từ site công khai, lưu DB thật
- Database: 23 bảng (xem mục 4.1b), đã seed dữ liệu mẫu (xem mục 9 — tài khoản test)
- Workflow migration versioned (`db:generate` + `db:migrate`) — **đã thực sự triển khai** (trước đây chỉ ghi trong tài liệu nhưng `package.json` còn thiếu, gây lỗi thật khi lỡ chạy `db:push` trên DB đã tồn tại — xem mục 4.2)

**Tất cả các trang công khai trong SRS Giai đoạn 1 giờ đã có nội dung thật —
không còn `PageStub` nào ở route chính.** (Ghi chú này từng SAI một thời
gian dài: `/nganh-dao-tao` + `/nganh-dao-tao/[slug]` vẫn là `PageStub` dù
admin đã có đầy đủ CRUD, chỉ phát hiện ra ở lượt rà soát lần 2 — xem mục 5
"Rà soát admin + web công khai lần 2". Nay đã sửa, ghi chú này giờ đúng thật.)

### Ghi chú thêm cho vài trang (không còn là khung tạm)
- **Tin tức** (`/tin-tuc` danh sách + `/tin-tuc/[slug]` chi tiết) — đọc qua
  `getAllPublishedPosts()`/`getPublishedPostBySlug()` (`src/lib/data/posts.ts`,
  cùng file với `getLatestPublishedPosts()` Trang chủ đã dùng). Bài `draft`
  truy cập trực tiếp trả về 404 (không lộ bài chưa đăng).
- **Giới thiệu/Liên hệ** — đọc từ bảng `pages` qua `getPageBySlug()` (slug
  `gioi-thieu`/`lien-he`); nếu admin lỡ xoá trang tương ứng, tự động rơi về
  lại `PageStub` (không vỡ trang, không lỗi) — đây là PageStub duy nhất còn
  sót lại trong code, nhưng chỉ dùng làm fallback, không phải trạng thái mặc định.
  Liên hệ còn hiển thị thêm khối liên hệ thật lấy từ `site_settings`
  (địa chỉ/hotline/email/mạng xã hội, ẩn link nào còn để giá trị mặc định `"#"`).

### Danh sách ngành đào tạo — quản lý qua DB, không còn mảng tĩnh
Bảng `programs` (xem mục 4.1b), quản lý qua `admin/nganh-dao-tao` —
**không giới hạn 6 ngành**, thêm bao nhiêu tuỳ ý qua CMS. Có cờ `featured`
để chọn ngành hiện ở trang chủ (không đánh dấu ngành nào thì tự lấy 6 ngành
đầu). Màu thẻ tự xoay vòng qua `programGradient(index)` trong
`constants.ts`, không cần khai báo màu thủ công.

### Admin dễ dùng hơn — 4 cải tiến UX (tham khảo nhu cầu thực tế, không phải
### theo 1 site cụ thể nào)
- **Soạn nội dung có định dạng** — `MarkdownEditor` (`src/components/admin/MarkdownEditor.tsx`)
  thay textarea trắng cho `admin/bai-viet` (nội dung bài) và `admin/trang-tinh`
  (nội dung trang) — thanh công cụ B/I/H2/H3/trích dẫn/danh sách/link chèn cú
  pháp Markdown vào đúng vị trí con trỏ, có nút "Xem trước". Field DB **vẫn
  là text thường** (không đổi schema) — chỉ đổi cách soạn + cách hiển thị.
  Hiển thị lại qua `<MarkdownContent>` (`src/components/ui/MarkdownContent.tsx`,
  dùng `react-markdown`) ở mọi nơi từng dùng `whitespace-pre-line`: bài viết,
  Giới thiệu, Liên hệ, Công khai. **Lưu ý khi sửa lại 2 component này**: ô
  soạn (`<textarea>`) phải luôn nằm trong DOM kể cả lúc đang "Xem trước" (chỉ
  ẩn bằng class `hidden`, không được unmount) — nếu unmount, submit lúc đang
  xem trước sẽ mất nội dung vì FormData không đọc được field đã biến mất
  (đã tái hiện lỗi này thật khi test, đã sửa).
- **Xác nhận trước khi Xoá** — `<ConfirmDeleteButton>` (`src/components/admin/ConfirmDeleteButton.tsx`)
  thay mọi nút "Xoá" submit-ngay trong admin (đã áp dụng cho toàn bộ 9 trang
  có thao tác xoá). Dùng `window.confirm()` — chặn submit nếu người dùng bấm
  Huỷ. Khi thêm trang admin mới có nút Xoá, **luôn dùng component này**, không
  viết `<button type="submit">Xoá</button>` trần.
- **Tìm kiếm/lọc danh sách dài** — `admin/bai-viet` (lọc theo trạng thái +
  tìm theo tiêu đề) và `admin/tuyen-sinh` (lọc theo trạng thái + tìm theo
  tên/SĐT/CCCD) — lọc qua query param (`?q=`, `?status=`), fetch hết rồi lọc
  trong JS (đủ nhanh ở quy mô 1 trường, không cần query DB có điều kiện).
- **Chọn ảnh từ Thư viện media thay vì upload lại** — `<ImagePicker>`
  (`src/components/admin/ImagePicker.tsx`) thay `<input type="file">` trần ở
  5 nơi cần ảnh: Giảng viên, Đánh giá, Thư viện Trang chủ, Bài viết (ảnh đại
  diện), Nội dung Trang chủ (ảnh Hero). Action tương ứng dùng
  `resolveImageUrl()` (`src/lib/media.ts`, thay `saveUploadedFileIfPresent()`
  cũ) — ưu tiên: file mới tải lên > ảnh chọn từ thư viện > ảnh cũ (khi sửa).
  Field ẩn đặt tên `<field>Existing` (VD `photoExisting`, `avatarExisting`).

Cả 4 đã **test qua trình duyệt thật** (kể cả submit lúc đang xem trước
Markdown, xác nhận Huỷ/OK hộp thoại xoá, lọc kết hợp nhiều điều kiện, chọn
ảnh có sẵn không tạo bản upload trùng).

### Không chỉ tuyển sinh — 3 bổ sung sau khi so sánh với cyt.edu.vn
Người dùng nhận xét site quá thiên về tuyển sinh, đối chiếu cyt.edu.vn (Cao
đẳng Y tế Thanh Hóa) để bổ sung 3 hạng mục — **cả 3 đã test qua trình duyệt
thật**:

- **Trang Đội ngũ giảng viên đầy đủ** (`/doi-ngu-giang-vien`) — dùng lại
  nguyên `getFacultyList()`, không giới hạn số lượng (khác khối rút gọn 4
  người ở Trang chủ). Có link "Xem tất cả đội ngũ →" từ Trang chủ + mục menu
  phụ (nút ☰) trỏ tới trang này.
- **Widget "Công cụ nhanh" ở Trang chủ** — 4 ô tĩnh (Đăng ký xét tuyển/Tra
  cứu kết quả/Thư viện/LMS) ngay sau Hero, hardcode trong `page.tsx` (không
  phải nội dung biên tập qua admin — chỉ là điều hướng nội bộ tới trang có
  sẵn).
- **Đa ngôn ngữ tiếng Anh (dịch toàn bộ nội dung)** — người dùng chọn
  phương án lớn nhất khi được hỏi phạm vi (không phải chỉ 1 trang tóm tắt
  hay chỉ dịch khung giao diện). Kiến trúc:
  - **Chọn ngôn ngữ qua cookie `locale`** (`"vi"` mặc định | `"en"`), **không
    tách route `/en/...`** — lý do: site 1 người vận hành, không cần SEO đa
    ngôn ngữ chuẩn (phải dựng lại toàn bộ `(site)` thành `[locale]/...`, chi
    phí không tương xứng ở quy mô này). Đổi ngôn ngữ qua
    `src/components/site/LanguageSwitcher.tsx` (nút "VI | EN" trong thanh
    thông báo trên cùng) gọi Server Action `setLocaleAction`
    (`src/lib/locale-actions.ts` — **file riêng**, không gộp chung với
    `src/lib/locale.ts` chứa `getLocale()`/`pickLocale()`, vì Next.js không
    cho phép Server Action khai báo `"use server"` trong hàm nằm chung file
    với code bị Client Component import — đã gặp lỗi build thật khi gộp
    chung, tách file là cách sửa đúng theo khuyến nghị của Next.js).
  - **Data layer tự resolve theo ngôn ngữ** (`src/lib/data/*.ts`): mỗi hàm
    `get*()` tự gọi `getLocale()` rồi trả về field gốc (VD `name`) đã thay
    bằng bản `_en` tương ứng nếu đang ở chế độ EN và có dữ liệu — **giữ
    nguyên shape kiểu trả về cũ**, nên toàn bộ `page.tsx` công khai
    **không cần sửa gì**. `pickLocale(vi, en, locale)` fallback về bản
    tiếng Việt nếu bản Anh chưa nhập.
  - **QUAN TRỌNG — trang admin KHÔNG được dùng hàm data layer đã resolve
    locale**: admin luôn phải thấy/sửa đúng field tiếng Việt gốc, bất kể
    cookie `locale` của trình duyệt đang ở "en" hay "vi" (2 khu vực dùng
    chung 1 trình duyệt/cookie). Vì vậy `admin/cai-dat` và `admin/trang-chu`
    **phải** query `db.query.siteSettings`/`db.query.homepageContent` trực
    tiếp (không gọi `getSiteSettings()`/`getHomepageContent()`) — đã tái
    hiện lỗi thật lúc code (form admin hiện nhầm text tiếng Anh vào field
    "tiếng Việt" rồi lưu đè mất bản gốc) và sửa lại đúng theo quy ước #1 ở
    mục 6 (admin luôn gọi `db` trực tiếp).
  - **Admin nhập bản tiếng Anh**: mỗi form có thêm khối `<details>` "🇬🇧 Bản
    tiếng Anh (tuỳ chọn)" ngay dưới field tiếng Việt tương ứng — đóng mặc
    định, không bắt buộc nhập. Áp dụng ở `bai-viet`, `nganh-dao-tao`,
    `trang-tinh`, `danh-gia`, `giang-vien`, `doi-tac`, `thu-vien-trang-chu`,
    `menu`, `cai-dat`, `trang-chu`.
  - **Seed chỉ dịch sẵn phần hiển thị nhiều nhất** (`homepage_content`,
    `site_settings.announcementEn`, `nav_items.labelEn`, `categories.nameEn`,
    `programs.nameEn/summaryEn`) để demo có tác dụng ngay — bài viết, trang
    "Công khai", `content_en` ngành đào tạo **cố ý để trống** (nội dung mẫu/
    placeholder, dịch sẽ tự fallback về tiếng Việt tới khi admin nhập tay
    nội dung thật — không phải thiếu sót).
  - Không hỗ trợ ngôn ngữ thứ 3 trở lên (cột `_en` không mở rộng tốt cho
    nhiều ngôn ngữ — cần thì đổi sang bảng translations riêng lúc đó).

### Dịch tự động sang tiếng Anh — DeepL API (2 lớp: tự động lúc Lưu + nút chủ động)
Sau khi có hạ tầng đa ngôn ngữ, người dùng nhận thấy phần lớn nội dung
(bài viết, trang Công khai, giảng viên, đánh giá, đối tác...) vẫn hiện
tiếng Việt khi bấm EN — vì seed chỉ dịch sẵn phần nổi bật nhất, còn lại chờ
admin tự nhập tay. Người dùng sau đó xác nhận muốn **hoàn toàn tự động**:
"chỉ cần nhập tiếng Việt, khi chuyển tiếng Anh web tự dịch" — không cần
thêm thao tác. Đã hiện thực bằng **DeepL API** (miễn phí tới 500.000 ký
tự/tháng, không cần thẻ tín dụng — xem `.env.example` lấy key):

- `src/lib/translate.ts`:
  - `translateTexts(texts: string[])` — gọi DeepL, dịch nhiều đoạn trong 1
    request (tiết kiệm quota), tự nhận diện key Free (đuôi `:fx`) để gọi
    đúng endpoint `api-free.deepl.com`. Throw lỗi rõ ràng nếu thiếu key/key
    sai/hết quota.
  - `autoFillTranslations(pairs: {vi, en}[])` — **lớp tự động chính**: chỉ
    dịch những field có `en` đang rỗng (field nào admin đã tự gõ/sửa tay
    thì giữ nguyên, không ghi đè); nếu thiếu `DEEPL_API_KEY` hoặc gọi API
    lỗi thì **im lặng trả lại nguyên trạng** (không throw) — không được để
    lỗi dịch chặn mất thao tác Lưu bài của admin, nội dung vẫn đúng nhờ
    fallback về tiếng Việt (`pickLocale`) ở tầng hiển thị.
- **Mọi `actions.ts` có field `_en`** (`bai-viet`, `nganh-dao-tao`,
  `trang-tinh`, `danh-gia`, `giang-vien`, `doi-tac`, `thu-vien-trang-chu`,
  `menu`, `cai-dat`, `trang-chu`) đều gọi `autoFillTranslations(...)` ngay
  trước khi ghi DB — admin chỉ cần gõ tiếng Việt như bình thường rồi bấm
  Lưu, bản tiếng Anh tự xuất hiện, không cần biết tới DeepL. `trang-chu`
  (11 field rời rạc + mảng stats/features/steps) gộp hết thành 1 mảng pair
  rồi gọi `autoFillTranslations` đúng 1 lần (1 request DeepL cho cả trang).
- **Vẫn giữ nút "🌐 Dịch tự động sang tiếng Anh"** (`AutoTranslateButton.tsx`,
  `translate-actions.ts` — Server Action `translateFieldsAction`, **file
  riêng** với `translate.ts` vì bị Client Component import, theo đúng lý do
  đã nêu ở mục "Đa ngôn ngữ") ở mọi khối `<details>` "🇬🇧" — dùng khi admin
  **sửa lại nội dung tiếng Việt của bài đã có bản Anh cũ** và muốn dịch lại
  ngay để xem trước (tự động lúc Lưu chỉ điền khi `en` đang rỗng, không tự
  refresh bản dịch cũ).
- Khi thêm trang admin mới có field `_en`, luôn làm cả 2: gọi
  `autoFillTranslations` trong `actions.ts` lúc lưu, **và** thêm
  `<AutoTranslateButton pairs={[...]} />` cạnh field — không chỉ làm 1
  trong 2.

### Sự kiện, Form Liên hệ thật, FAQ, Trang chi tiết giảng viên
Tiếp tục so sánh với cyt.edu.vn/RMIT/HMU, người dùng chọn thêm 4 hạng mục —
**cả 4 đã test qua trình duyệt thật** (kể cả gửi thật 1 tin nhắn liên hệ và
xác nhận admin xem được):

- **Sự kiện** (`/su-kien`, admin `admin/su-kien`) — bảng `events` riêng,
  **khác Tin tức/`posts`** (không có trạng thái nháp/đăng, có `start_at`/
  `end_at`). Trang công khai tự tách "Sắp diễn ra"/"Đã diễn ra" theo
  `start_at` so với giờ hiện tại — logic so sánh đặt trong 1 hàm thường
  `splitUpcomingPast()` bên ngoài component (không phải trong thân
  component), vì ESLint rule `react-hooks/purity` (React Compiler) cấm gọi
  hàm impure như `Date.now()` trực tiếp trong component — **khi cần lấy
  thời điểm hiện tại ở trang nào, luôn tách ra hàm helper riêng như vậy**,
  đừng gọi `Date.now()`/`new Date()` không đối số thẳng trong hàm component.
- **Form Liên hệ thật** (`/lien-he` thêm `<ContactForm>`, POST
  `/api/contact`) — trang `/lien-he` từ chỗ chỉ hiện thông tin tĩnh giờ có
  form gửi câu hỏi thật, lưu bảng `contact_messages`, admin xem/đánh dấu đã
  xem/xoá qua `admin/lien-he`. `ContactForm.tsx` copy nguyên pattern từ
  `AdmissionForm.tsx` (chụp `const form = e.currentTarget` **trước** mọi
  `await` — xem lỗi thật đã gặp ở mục 4.2/lịch sử trước đây).
- **FAQ** (`/faq`, admin `admin/faq`) — bảng `faqs` đơn giản (câu hỏi/trả
  lời + `sortOrder`), trang công khai dùng `<details>` HTML thuần để
  expand/collapse (không thêm state/JS, giống pattern khối 🇬🇧 trong admin).
- **Trang chi tiết giảng viên** (`/doi-ngu-giang-vien/[slug]`) — mở rộng
  bảng `faculty` thêm `slug` (nullable — xem lý do kỹ thuật dưới), `bio`,
  `education`, `specialty` (đều có cặp `_en`). Thẻ giảng viên ở Trang chủ
  và trang danh sách giờ bấm vào mở trang riêng từng người.
  **Lưu ý kỹ thuật quan trọng**: cột `faculty.slug` khai báo **nullable**
  (không `notNull()`) dù mọi slug khác trong dự án (`posts`, `programs`,
  `pages`) đều `notNull().unique()` — vì bảng `faculty` **đã có sẵn dữ
  liệu** lúc thêm cột này, mà SQLite không cho `ALTER TABLE ADD COLUMN` với
  `NOT NULL` khi bảng có dòng mà không kèm `DEFAULT`. Action luôn tự sinh
  slug lúc tạo mới nên trong thực tế cột này luôn có giá trị — nhưng **nếu
  sau này thêm cột `notNull().unique()` mới vào 1 bảng đã có dữ liệu, nhớ
  lại đúng vấn đề này** (nullable trước, hoặc seed backfill trước khi đổi
  sang not-null thật sự nếu cần).

### Banner Trang chủ nhiều ảnh + nút liên hệ nhanh nổi (tham khảo th.hopluchospital.com)
Người dùng đưa trang bệnh viện cùng hệ thương hiệu Hợp Lực làm tham khảo,
chốt 2 hạng mục **chức năng** (rõ ràng nói sẽ làm hiệu ứng mượt hơn ở đợt
sau, đợt này chỉ làm phần chạy được):

- **Banner Trang chủ nhiều ảnh** — bảng `hero_banners` mới (`imageUrl`,
  `caption`/`captionEn`, `linkUrl` tuỳ chọn, `sortOrder`), quản lý qua
  `admin/banner-trang-chu`. Hiển thị qua `<HeroImageCarousel>`
  (`src/components/site/HeroImageCarousel.tsx`, client component) — **chưa
  thêm banner nào thì tự fallback về `homepage_content.heroImageUrl` cũ**
  (không phá site đang chạy). Có >1 banner thì tự đổi ảnh mỗi 5s + chấm
  tròn bấm chuyển tay — **chuyển thẳng (hard cut), cố ý chưa làm hiệu ứng
  fade/slide mượt** theo đúng yêu cầu "xong hết chức năng mới làm hiệu ứng".
- **Nút liên hệ nhanh nổi** — `<QuickContactWidget>`
  (`src/components/site/QuickContactWidget.tsx`) render trong
  `(site)/layout.tsx`, hiện ở mọi trang công khai. Lấy thẳng từ
  `site_settings` đã có (hotline/zaloUrl/facebookUrl) — **không thêm bảng
  DB mới**. Link nào còn giá trị mặc định `"#"` thì tự ẩn (giống pattern đã
  dùng ở Liên hệ/Footer).

### Cấu trúc lại Giảng viên: Khoa/Bộ môn + Học vị/Học hàm/Chức vụ tách riêng
Người dùng nhận xét admin Giảng viên "thiết kế chưa chuẩn" — so sánh cyt.edu.vn
(Cao đẳng Y tế Thanh Hóa) thì họ nhóm giảng viên theo **Bộ môn**, và tách
riêng Học vị/Chức vụ/Chuyên môn thay vì gộp chung 1 chuỗi. Vấn đề cụ thể ở
web mình trước đó: tên bị gõ dính học vị ngay trong ô "Họ tên" (VD "ThS.BS
Nguyễn Văn An"), và "Học vị/bằng cấp" là 1 ô free-text gộp cả trường+ngành,
không có khái niệm Khoa/Bộ môn nào. Đã sửa:

- **Bảng `departments`** (Khoa/Bộ môn) — danh mục riêng y hệt `categories`
  (bài viết), quản lý qua `admin/khoa`. `faculty.departmentId` trỏ tới đây
  (tuỳ chọn — không phải giảng viên nào cũng thuộc 1 khoa, VD Ban Giám hiệu).
  Xoá 1 khoa **không xoá** giảng viên thuộc khoa đó, chỉ gỡ liên kết (giống
  cách `deleteCategoryAction` xử lý bài viết mất danh mục).
- **`faculty.name`** giờ **chỉ chứa họ tên thuần** — học vị (`degree`, VD
  "ThS.BS") và học hàm (`academicRank`, VD "PGS" — hiếm, tuỳ chọn) tách
  thành 2 cột riêng. `role` giữ nguyên ý nghĩa "chức vụ" (đã đúng từ trước,
  không đổi). Hàm `facultyDisplayName()` (`src/lib/data/faculty.ts`) ghép
  lại `{academicRank} {degree} {name}` để hiển thị — **dùng hàm này ở mọi
  nơi hiện tên giảng viên công khai** (Trang chủ, danh sách, chi tiết,
  `<title>`), không tự ghép tay ở từng trang.
- Cột `education`/`education_en` cũ **để lại không dùng nữa** (rỗng, không
  xoá cột) — lý do kỹ thuật giống hệt cột `faculty.slug` nullable: bảng đã
  có dữ liệu, đổi tên cột dễ bị drizzle-kit hiểu nhầm rename ↔ add/drop,
  từng gây prompt tương tác chặn `db:generate` (xem lịch sử mục 4.2).
- Trang `/doi-ngu-giang-vien` giờ **nhóm theo Khoa** (mỗi khoa 1 khối, khoa
  nào không có giảng viên thì không hiện khối rỗng), giảng viên chưa gán
  khoa gom vào khối "Khác" ở cuối.
- Seed: backfill dữ liệu mẫu cũ (tên có sẵn "ThS.BS Nguyễn Văn An"...) tách
  đúng thành `name`/`degree` + gán khoa tương ứng — chỉ áp dụng khi `degree`
  đang rỗng, không đụng dữ liệu admin đã tự sửa tay.

### Sidebar admin theo khối thực thể + Học hàm/Học vị/Chức vụ thành danh mục
Người dùng gửi ảnh chụp 1 CMS khác (nhóm "Bác sĩ" có sẵn Danh mục/Loại danh
mục/Học hàm-Học vị-Chức vụ như các trang con riêng) và nói rõ: áp dụng luôn
cho Bài viết và các mục khác, không chỉ Giảng viên. Đã làm:

- **`ADMIN_NAV`** (`src/lib/constants.ts`) đổi từ 4 super-category phẳng
  ("Tổng quan"/"Nội dung"/"Tuyển sinh & Liên hệ"/"Cấu hình") sang **danh
  sách thực thể** — thực thể nào có ≥2 trang quản lý liên quan mới gom
  thành khối `children` (thu gọn/mở rộng được); chỉ 1 trang thì để thẳng
  `href`, không bọc `children` cho khỏi thừa 1 lượt bấm. Hiện có 4 khối:
  **Bài viết** (Bài viết, Danh mục), **Giảng viên** (Đội ngũ giảng viên,
  Khoa/Bộ môn, Học hàm/Học vị/Chức vụ), **Trang chủ** (Banner, Thư viện ảnh,
  Nội dung Trang chủ), **Tuyển sinh & Liên hệ** (Đăng ký tuyển sinh, Tin
  nhắn liên hệ). **Khi thêm trang admin mới liên quan tới 1 thực thể đã có
  sẵn ở đây, thêm vào đúng khối đó — đừng tạo entity mới tách rời.**
- **`AdminSidebar.tsx`** viết lại thành cây 2 cấp: entity không có
  `children` → link thẳng; có `children` → header là **`<button>` chỉ để
  đóng/mở** (không phải link — bấm vào không điều hướng đi đâu, đúng mẫu
  người dùng gửi), children thụt vào bên dưới. Khối chứa route đang mở tự
  giãn sẵn (tính 1 lần lúc mount qua `useState(() => ...)`, không cần
  `useEffect`).
- **"Danh mục" bài viết tách thành trang riêng** `admin/danh-muc` (trước
  đây quản lý ngay trong `admin/bai-viet`, giờ trang Bài viết chỉ còn
  dropdown chọn + link "Quản lý danh mục" trỏ sang) — để đúng "1 trang = 1
  việc quản lý" giống mọi entity khác, không đặc cách bài viết nữa.
- **Bảng `faculty_attributes`** — Học hàm/Học vị/Chức vụ giờ là danh sách
  quản lý chung 1 trang (`admin/danh-hieu`, 3 khối trong 1 trang, phân biệt
  bằng cột `type`: `academic_rank`/`degree`/`position`), thay vì gõ tay tự
  do như trước (tránh "ThS" và "Th.S" cùng tồn tại). **Vẫn lưu giá trị dạng
  chuỗi thẳng vào `faculty.degree`/`academicRank`/`role`** (không đổi sang
  lưu ID tham chiếu) — form Giảng viên chỉ đổi từ `<input>` sang `<select>`
  lấy option từ bảng này, mọi chỗ đọc/hiển thị dữ liệu Giảng viên (data
  layer, `facultyDisplayName()`, trang công khai) **không đổi gì** — giữ độ
  rủi ro thấp, không cần lớp data layer riêng cho `faculty_attributes` vì
  chỉ dùng trong admin (đúng quy ước #1 mục 6).

### Trang chủ đầy đủ hơn (tham khảo hmu.edu.vn)
So sánh với hmu.edu.vn (Đại học Y Hà Nội), phát hiện đã xây xong Sự kiện
(trang + admin) ở đợt trước nhưng **quên đưa lên Trang chủ** — tự sửa luôn.
Cộng thêm 3 hạng mục người dùng chọn từ nghiên cứu:

- **Sự kiện sắp diễn ra ở Trang chủ** — section mới trước khối Tin tức,
  lọc 3 sự kiện gần nhất có `start_at >= hiện tại` qua hàm thường
  `upcomingEvents()` (không phải trong thân component — lý do giống hệt
  `splitUpcomingPast()` ở `/su-kien`, xem mục 5 "Sự kiện, Form Liên hệ
  thật..."). Khối "Tin tức" đổi tên từ "Tin tức & sự kiện" thành "Tin tức"
  cho khỏi trùng ý.
- **Sứ mệnh - Tầm nhìn** — 2 cột `mission_text`/`vision_text` (+ `_en`)
  thêm vào `homepage_content`, **nullable** (khác các field Hero/CTA khác
  trong bảng này vốn `notNull`) — cố ý để tuỳ chọn, admin để trống thì
  Trang chủ tự ẩn cả khối, không bắt buộc điền ngay.
- **Học bổng** — **không** tạo bảng riêng, tận dụng luôn hệ thống Danh mục
  bài viết có sẵn: seed thêm danh mục `hoc-bong`, `getAllPublishedPosts()`
  (`src/lib/data/posts.ts`) nhận thêm tham số `categorySlug` tuỳ chọn để
  lọc, trang `/tin-tuc` đọc `?category=` từ `searchParams` để hiện đúng
  tiêu đề/mô tả "Học bổng" khi lọc theo danh mục này. Mục menu "Học bổng"
  trỏ thẳng `/tin-tuc?category=hoc-bong`. **Khi cần thêm 1 "chuyên mục" tin
  bài mới tương tự (không phải nội dung có cấu trúc riêng), làm theo đúng
  pattern này — thêm danh mục + query filter, đừng vội tạo bảng mới.**
- **Banner "Công khai theo quy định"** ở cuối Trang chủ (trước CTA band) —
  dải link tĩnh trỏ `/cong-khai`, không cần dữ liệu DB (mục Công khai vốn
  đã ẩn khá sâu trong nút ☰, banner này tăng khả năng nhìn thấy trên Trang
  chủ mà không cần đổi cấu trúc menu).

### Đợt "hiệu ứng" Trang chủ — 4 hiệu ứng, thuần CSS/JS không thêm thư viện
Sau khi hỏi lại phạm vi cụ thể (đúng quy trình đã ghi ở mục 7), người dùng
chọn cả 4:

- **`src/components/site/Reveal.tsx`** — bọc 1 khối để mờ/trượt nhẹ lên khi
  cuộn tới lần đầu (IntersectionObserver thuần). Đã bọc quanh gần như mọi
  section ở `(site)/page.tsx`. **Có hẹn giờ dự phòng 2s**: observer không
  bao giờ bắn (VD tab mở nền chưa từng hiện) thì tự hiện — bắt buộc phải có
  bước này, nếu không nội dung có thể bị kẹt vô hình vĩnh viễn (đã tái hiện
  đúng rủi ro này lúc test trong sandbox: trang ở trạng thái
  `document.visibilityState === "hidden"` khiến observer không bắn được).
- **`src/components/site/CountUp.tsx`** — đếm tăng dần tới giá trị thật (VD
  "12+", "8.500+", "96%") khi vào tầm nhìn, tách số/hậu tố bằng regex, dùng
  `toLocaleString("vi-VN")` để giữ dấu chấm phân cách nghìn kiểu Việt Nam.
  Dùng ở 4 chỉ số thống kê + 2 badge nổi Hero. **Cũng có hẹn giờ dự phòng
  2s** — lý do giống hệt `Reveal`, quan trọng hơn nữa vì nếu kẹt sẽ hiện
  sai số liệu ("0") chứ không chỉ vô hình.
- **`HeroImageCarousel`** — chuyển từ đổi ảnh thẳng (hard cut) sang
  crossfade: mọi banner luôn nằm trong DOM (không unmount/remount `<Image>`
  nên không giật/tải lại), chỉ đổi `opacity` với `transition-opacity
  duration-1000`.
- **`QuickContactWidget`** — đổi từ luôn hiện sẵn cả 3 nút sang có 1 nút
  chính (dấu +, xoay 45° thành dấu × khi mở) bấm mới xoè các lựa chọn ra,
  so le nhẹ bằng `transitionDelay` tăng dần theo thứ tự — tham khảo đúng
  th.hopluchospital.com.

**Bài học chung rút ra khi làm hiệu ứng dựa trên IntersectionObserver/timer
trong dự án này**: luôn kèm 1 hẹn giờ dự phòng (`setTimeout` fallback) để
tự hoàn tất trạng thái cuối nếu observer/timer chính không bao giờ bắn —
đừng để hiệu ứng "vào" (entrance) là điều kiện duy nhất quyết định nội
dung có hiển thị/đúng số liệu hay không.

### Nút liên hệ nhanh quản lý qua admin (`quick_contacts`)
Người dùng nhận ra nút liên hệ nhanh (lúc đó đọc thẳng từ
`site_settings.hotline/zaloUrl/facebookUrl`) không thể thêm mục mới (VD
"Tin nhắn", "ChatbotAI") hay đổi link riêng từng mục qua admin. Tách hẳn ra
bảng riêng:

- **`quick_contacts`**: `type` (discriminator: `hotline`/`zalo`/`facebook`/
  `message`/`chatbot`/`custom`) + `label`/`label_en` + `href` (nhập nguyên
  link, VD `tel:...` hay `https://...`) + `sort_order`. Cùng pattern
  discriminator-`type` như `faculty_attributes` — 1 bảng, 1 trang admin,
  `type` quyết định icon/màu hiển thị ở `QuickContactWidget.tsx` (map
  `TYPE_STYLE` theo `type`, không phải theo từng dòng dữ liệu).
- **Admin `admin/lien-he-nhanh`**: list + form, chọn `type` qua dropdown có
  gợi ý định dạng link theo từng loại (VD gợi ý `tel:19006868` khi chọn
  Hotline) — theo đúng pattern CRUD list/form đã dùng cho `admin/khoa`,
  `admin/danh-hieu`, `admin/faq`.
- **"ChatbotAI" chỉ là 1 icon/link trong danh sách, KHÔNG phải chatbot AI
  thật** — đã hỏi lại phạm vi qua `AskUserQuestion` và người dùng chọn rõ
  ràng phương án đơn giản (không tích hợp AI provider/API/giao diện hội
  thoại riêng). Nếu sau này cần chatbot thật, đó là 1 tính năng lớn khác,
  không phải chỉnh sửa bảng này.
- **Seed mặc định**: tự lấy hotline/Zalo/Facebook từ `site_settings` hiện
  có (bỏ qua Zalo/Facebook nếu đang là placeholder `"#"`), cộng thêm 2 mục
  placeholder "Tin nhắn"/"ChatbotAI" với `href: "#"` để trường tự điền link
  thật sau.
- `site_settings.hotline/zaloUrl/facebookUrl` **vẫn giữ nguyên** — vẫn dùng
  ở nơi khác (header, footer) — chỉ riêng widget nổi góc màn hình là đổi
  sang đọc từ `quick_contacts`.

### Rà soát trước khi đưa web lên mạng thật — bảo mật/SEO cơ bản
Người dùng yêu cầu đánh giá tổng thể xem site "đã ổn chưa" trước khi công
bố — đã xử lý 5 hạng mục ưu tiên cao tìm được (nội dung/ảnh thật vẫn chờ
người dùng tự điền, xem mục 7 mục 2):

- **Chống spam form công khai** — `src/lib/rate-limit.ts` (bộ đếm trong bộ
  nhớ theo IP, không cần Redis) áp dụng cho `/api/admissions` (5 lần/10
  phút), `/api/contact` (5 lần/10 phút), `/api/admissions/tra-cuu` (20
  lần/10 phút — lỏng hơn vì tra cứu là thao tác đọc hợp lệ lặp lại được,
  nhưng vẫn cần chặn dò quét CCCD hàng loạt). Kèm **honeypot** field ẩn
  (`website`) ở `AdmissionForm`/`ContactForm` — bot tự động điền form
  thường điền cả field ẩn này, server nhận diện rồi giả vờ thành công
  (không lộ cho bot biết bị chặn) mà không ghi gì vào DB.
- **SEO cơ bản** — `src/app/robots.ts` + `src/app/sitemap.ts` (tự sinh từ
  DB: bài viết/ngành đào tạo/giảng viên/trang Công khai, không cần cập
  nhật tay), `src/app/opengraph-image.tsx` (ảnh chia sẻ Facebook/Zalo,
  dựng bằng `next/og` — không cần thiết kế ảnh tĩnh riêng), thêm
  `openGraph`/`twitter`/`metadataBase` vào `src/app/layout.tsx`. Cần biến
  môi trường mới **`NEXT_PUBLIC_SITE_URL`** (xem `.env.example`) — domain
  thật, **nhớ set trước khi deploy** (mặc định tạm `localhost` lúc dev).
- **Header bảo mật cơ bản** — `next.config.js` thêm
  X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy
  cho mọi route. **Cố ý chưa thêm CSP** (Content-Security-Policy) — cấu
  hình sai dễ tự làm vỡ site (chặn nhầm Google Fonts, inline style
  Tailwind...) hơn là lợi ích thực tế ở quy mô 1 trường, để dành làm sau
  nếu cần, kỹ hơn và có test đầy đủ.
- **Chặn chạy production với `SESSION_SECRET` mẫu** — `src/lib/auth.ts`
  `getSecret()` giờ throw lỗi rõ ràng nếu `NODE_ENV=production` mà secret
  vẫn đúng y chuỗi mẫu trong `.env.example` — tránh quên đổi rồi session
  admin bị giả mạo được.
- **Chặn dò mật khẩu đăng nhập admin** — phát hiện ở lượt rà soát lại lần 2
  (sau khi đã có nhiều tài khoản qua `admin/nguoi-dung`, form đăng nhập vẫn
  không giới hạn số lần thử): `loginAction`
  (`src/lib/actions/auth-actions.ts`) dùng lại `checkRateLimit` — giới hạn
  theo **cả IP lẫn email** riêng (5 lần/10 phút theo email, 20 lần/10 phút
  theo IP) để 1 người gõ sai nhiều lần không khoá lây người khác chung
  mạng. Đã test qua trình duyệt thật: 4 lần sai đầu hiện "Sai tài khoản
  hoặc mật khẩu", lần 5-6 chuyển sang thông báo chặn tạm thời.

### Phân quyền admin theo module (`admin_users.permissions`)
Site sẽ có nhiều người dùng cùng vào khu vực quản trị — người dùng yêu cầu
rõ cần tạo tài khoản + phân quyền, chọn phương án **chi tiết theo từng
module** (không phải 2-3 cấp vai trò cố định):

- **`admin_users.permissions`**: cột mới, mảng JSON các module key (VD
  `["posts","faculty"]`). **`NULL` = toàn quyền** — mọi tài khoản tạo
  trước khi có tính năng này (kể cả tài khoản seed) giữ nguyên `NULL` qua
  migration, không tự nhiên bị khoá quyền khi nâng cấp lên bản có phân
  quyền. Tài khoản tạo mới qua `admin/nguoi-dung` luôn có mảng cụ thể.
- **Danh sách module = `PERMISSION_MODULES`** (`src/lib/constants.ts`) —
  lấy thẳng từ `ADMIN_NAV` (trừ `dashboard`, ai đăng nhập cũng thấy) nên
  luôn khớp 1-1 với sidebar, **không khai báo trùng danh sách module ở 2
  nơi**. Thêm 1 entity mới vào `ADMIN_NAV` là tự động có thêm 1 module để
  phân quyền, không cần sửa gì thêm.
- **`src/lib/admin-auth.ts`** — lớp phân quyền dùng chung:
  `getCurrentAdminUser()` (bọc `cache()` của React — 1 request dù gọi ở cả
  layout lẫn page cũng chỉ query DB đúng 1 lần), `hasPermission(user, key)`,
  và `requirePermission(key)` — gọi ở **đầu MỌI `page.tsx` VÀ MỌI hàm
  trong `actions.ts` cần giới hạn quyền** (chặn ở cả 2 lớp: render trang
  lẫn gọi thẳng Server Action, vì Server Action gọi được độc lập không chỉ
  qua render trang). Đã áp dụng cho toàn bộ 20 trang admin hiện có +
  tương ứng actions.ts (trừ `admin/page.tsx` Dashboard và trang đăng
  nhập — ai đăng nhập cũng xem được Dashboard).
- **`AdminSidebar.tsx`** lọc `ADMIN_NAV` theo `permissions` nhận từ layout
  (`admin/(dashboard)/layout.tsx` gọi `getCurrentAdminUser()` 1 lần, truyền
  xuống) — mục nào không có quyền thì **không hiện trong sidebar**, đồng
  thời `requirePermission()` vẫn chặn nếu cố vào thẳng URL.
- **`admin/nguoi-dung`** (module key `users`) — CRUD tài khoản, checkbox
  chọn từng module. Có 2 lớp chống tự khoá quyền của chính mình: (1) form
  luôn ép quyền `users` phải còn trong danh sách khi tự sửa tài khoản đang
  đăng nhập (server-side, không tin ô checkbox bị disable ở client vì input
  `disabled` không được gửi lên trong `FormData`), (2) không cho xoá tài
  khoản `users` cuối cùng còn lại trong hệ thống, không cho tự xoá chính
  mình.
- **Không phải mọi dữ liệu nhạy cảm được che 100%** — Dashboard (mọi tài
  khoản đăng nhập đều xem) vẫn hiện số lượng hồ sơ tuyển sinh/tin nhắn mới
  dạng con số tổng (không phải chi tiết CCCD/tên) — chấp nhận được vì đây
  là số liệu tổng hợp thông thường của 1 khối KPI, dữ liệu chi tiết thật sự
  nhạy cảm vẫn nằm sau `requirePermission("admissions-contact")` ở
  `admin/tuyen-sinh`/`admin/lien-he`.

### Rà soát thao tác admin — vá 2 lỗ hổng CRUD + sửa hành vi Lưu form
Người dùng yêu cầu rà soát lại toàn bộ thao tác trong admin, tự test và
nhận xét "sửa/thêm mới cái gì bấm Lưu form vẫn hiện ở đó, nên nhảy sang
giao diện khác". Rà soát phát hiện:

- **Bài viết (`admin/bai-viet`) và Danh mục bài viết (`admin/danh-muc`)
  KHÔNG có chức năng Sửa** — trước đây chỉ Tạo/Xoá (bài viết còn có thêm
  Đăng/Gỡ đăng), viết sai chính tả hay cần cập nhật nội dung không có cách
  nào khác ngoài xoá rồi tạo lại (mất slug/link cũ, ảnh hưởng SEO nếu bài
  đã được chia sẻ/Google index). Đã vá: cả 2 chuyển sang `upsertPostAction`/
  `upsertCategoryAction` theo đúng pattern `?edit={id}` dùng ở mọi trang
  admin khác (xem mục 6 quy ước #8). **Sửa bài viết/danh mục KHÔNG đổi
  slug dù đổi tiêu đề/tên** — cố ý, tránh vỡ link cũ; slug chỉ sinh 1 lần
  lúc tạo mới. Sửa bài viết cũng KHÔNG đổi trạng thái đăng/nháp qua form —
  vẫn dùng riêng nút "Đăng ngay"/"Gỡ đăng" ở danh sách như cũ, tránh 1 form
  làm 2 việc.
- **Học hàm/Học vị/Chức vụ (`admin/danh-hieu`) cũng thiếu Sửa** (chỉ
  Thêm/Xoá) — nhưng vì đây là danh sách nhỏ dạng thẻ (3 cột), **không dùng
  pattern `?edit=` cồng kềnh** mà cho sửa trực tiếp tại chỗ: mỗi dòng là 1
  `<form>` riêng với input tên (`defaultValue`) + nút "Lưu", gộp chung
  `createFacultyAttributeAction` cũ thành `upsertFacultyAttributeAction`.
  Đổi tên không tự dịch lại bản tiếng Anh cũ (giữ nguyên nếu đã có, tránh
  ghi đè bất ngờ).
- **Hành vi "Lưu form vẫn đứng yên" ở TOÀN BỘ trang dùng pattern `?edit=`**
  (13 trang có sẵn + 2 trang vừa vá ở trên) — nguyên nhân: các `upsertXxxAction`
  trước đây chỉ gọi `revalidatePath()`, không `redirect()`, nên sau khi Lưu,
  Next.js soft-navigate về ĐÚNG URL đang đứng (`?edit=id` vẫn còn), form vẫn
  hiện dữ liệu vừa sửa — không rõ ràng là đã lưu xong hay chưa, không có
  cách quay nhanh về trạng thái "Thêm mới". Đã vá: mọi `upsertXxxAction`
  (trừ `cai-dat`/`trang-chu` — 2 trang **cấu hình 1 dòng duy nhất**, không
  phải danh sách Thêm/Sửa nên KHÔNG áp dụng, ở lại trang là đúng) giờ gọi
  thêm `redirect(basePath)` (VD `redirect("/admin/bai-viet")`) làm dòng
  cuối cùng, sau mọi `revalidatePath` — Lưu xong tự về danh sách sạch +
  form "Thêm mới" trống, đúng cảm giác "nhảy sang giao diện khác" người
  dùng mong muốn. **Quy ước cho trang admin mới theo pattern `?edit=`**:
  luôn thêm `redirect(basePath)` cuối `upsertXxxAction`, KHÔNG thêm cho
  trang cấu hình 1 dòng.

### Rà soát admin + web công khai lần 2 — vá 8 lỗi theo mức độ ưu tiên
Người dùng yêu cầu rà soát toàn diện thêm 1 lần nữa (cả admin lẫn web công
khai) trước khi phản hồi — đọc hết `page.tsx`+`actions.ts` của 21 trang
admin và 14 trang công khai, tìm được 8 vấn đề, xếp mức độ rồi sửa từ cao
xuống thấp:

- **🔴 Nghiêm trọng — `/nganh-dao-tao` và `/nganh-dao-tao/[slug]` chỉ là
  `PageStub`** dù `admin/nganh-dao-tao` đã có đầy đủ CRUD (mã ngành, thời
  lượng, chỉ tiêu, mô tả, nội dung chi tiết) — mọi thẻ ngành ở Trang chủ
  đều dẫn tới "Trang đang được xây dựng". Đây là gap lớn nhất từng có
  trong dự án, và ghi chú cũ ở mục 5 "không còn PageStub nào ở route
  chính" là **sai** — đã sửa lại đúng thực tế. Đã dựng 2 trang thật: danh
  sách dạng lưới thẻ màu (tái dùng đúng style card ở Trang chủ, xem
  `programGradient()`) + trang chi tiết (thời gian/chỉ tiêu/nội dung
  Markdown, có nút CTA "Đăng ký xét tuyển ngành này"). Ngành nào chưa nhập
  `content` thì hiện dòng gợi ý liên hệ hotline thay vì để trống trơn.
- **🟠 Cao — Footer hard-code cứng 6 ngành đào tạo** (`PROGRAM_LINKS` tĩnh
  trong `SiteFooter.tsx`) — vi phạm nguyên tắc "quản lý qua CMS, không
  hard-code". Đã sửa: `(site)/layout.tsx` gọi thêm `getPrograms()`, truyền
  xuống `SiteFooter` qua prop `programs`, footer tự lấy 6 ngành đầu từ DB
  (`.slice(0, 6)`) — admin đổi ngành ở CMS là footer cập nhật theo, không
  còn lệch.
- **🟠 Cao — `admin/tuyen-sinh` không xoá được hồ sơ** (chỉ đổi trạng
  thái) — thêm `deleteAdmissionAction` + nút Xoá (`ConfirmDeleteButton`)
  theo đúng pattern các trang khác.
- **🟡 Trung bình — `admin/cai-dat`/`admin/trang-chu` (trang cấu hình 1
  dòng, cố ý KHÔNG `redirect()` — xem quy ước #8 mục 6) không có thông báo
  "Đã lưu thành công"** — đã thêm: action `redirect(path + "?saved=1")` về
  lại chính trang đó (không phải sang trang khác, giữ đúng thiết kế), page
  đọc `searchParams.saved` để hiện banner xanh xác nhận.
- **🟡 Trung bình — Chưa có trang Chính sách bảo mật**, footer trước đó là
  `<span>` tĩnh giả làm link. Đã tạo `/chinh-sach-bao-mat` (đọc qua
  `getPageBySlug`, cùng pattern `gioi-thieu`/`lien-he`), seed nội dung
  khung liệt kê đúng dữ liệu 2 form công khai (Tuyển sinh, Liên hệ) đang
  thu thập thật + mục đích sử dụng — theo tinh thần Nghị định
  13/2023/NĐ-CP, **không phải văn bản pháp lý chính thức**, cần bộ phận
  phụ trách rà soát trước khi xem là hoàn chỉnh (giống cách các trang "3
  công khai" đã làm).
- **🟡 Trung bình — Giờ Sự kiện lệch múi giờ nếu server không đặt giờ Việt
  Nam** — `admin/su-kien` trước đó dùng `new Date(iso).getHours()` (giờ
  LOCAL CỦA MÁY CHỦ) để đổ vào ô `datetime-local` lúc Sửa, và
  `new Date(startAt).toISOString()` (cũng hiểu chuỗi nhập theo giờ local
  máy chủ) lúc Lưu — đúng trên máy dev (múi giờ Asia/Saigon) nhưng SAI nếu
  deploy lên server đặt múi giờ khác (VD US cloud mặc định UTC): giờ hiện
  ra khi Sửa lại sẽ lệch 7 tiếng so với giờ admin đã nhập. Cũng phát hiện
  `formatVNDate`/`formatVNDateTime` (dùng hiển thị ngày tin tức/sự kiện
  khắp site) có cùng lỗi gốc (`toLocaleDateString("vi-VN")` không kèm
  `timeZone` thì lấy giờ máy chủ). Đã sửa tận gốc trong
  `src/lib/utils.ts`: thêm `timeZone: "Asia/Ho_Chi_Minh"` vào
  `formatVNDate`/`formatVNDateTime`, và 2 hàm mới
  `vnDatetimeLocalToISO`/`isoToVnDatetimeLocal` tính thủ công theo offset
  cố định UTC+7 (Việt Nam không có giờ mùa hè, an toàn để cố định) —
  **hoàn toàn không phụ thuộc múi giờ máy chủ đang chạy**, đã tự kiểm tra
  bằng cách ép `TZ=UTC` lúc chạy Node để xác nhận. `admin/su-kien` đổi
  sang dùng 2 hàm mới này. **Nếu sau này thêm ô nhập ngày giờ nào khác
  (`datetime-local`), luôn dùng cặp hàm này, đừng tự viết lại bằng
  `new Date(...).getHours()`.**
- **🟢 Thấp — Nút Facebook/Zalo/YouTube ở footer vẫn hiện dù chưa cấu
  hình** (`site_settings` để mặc định `"#"`) — đã thêm lọc
  `!== "#"` giống cách widget liên hệ nhanh đã làm.
- **🟢 Thấp — Bảng "Chỉ tiêu & điều kiện" ở `/tuyen-sinh` không link được
  sang trang chi tiết ngành** — giờ trang chi tiết đã có thật (mục đầu
  tiên ở trên), đã thêm link tên ngành trỏ `/nganh-dao-tao/{slug}`.

### Nội dung demo + nhóm nâng cấp nhỏ đã hoãn (404/lỗi, CSP, email, GA)
Sau khi rà soát xong, người dùng yêu cầu tiếp 2 việc: (1) tự lấy dữ liệu
demo cho các phần đang trống, và (2) làm nốt nhóm nâng cấp nhỏ từng nêu
nhưng cố tình hoãn ở đợt rà soát bảo mật đầu tiên.

**Dữ liệu demo — chỉ làm phần nội dung chữ, KHÔNG làm phần ảnh:**
- Backfill `content`/`content_en` cho cả 6 ngành đào tạo (mục tiêu đào
  tạo, nội dung chương trình, thực hành lâm sàng, cơ hội nghề nghiệp) —
  `src/lib/db/seed.ts`, idempotent (chỉ set khi `content` đang trống),
  dùng `autoFillTranslations` để tự dịch. Nội dung THAM KHẢO/DEMO, không
  phải chương trình đào tạo chính thức đã phê duyệt.
- **Đã THỬ và BỎ tìm ảnh minh hoạ từ Wikimedia Commons** (nguồn ảnh miễn
  phí bản quyền, không cần API key) — kết quả không dùng được: phần lớn là
  ảnh tư liệu lịch sử (có cả ảnh y tế quân đội Mỹ thời chiến tranh Việt Nam
  1960-70s khi tìm "Vietnam hospital nurse"), hoặc ảnh sự kiện thật của tổ
  chức/người khác (VD đội y tế Hải quân Mỹ tại 1 trường tiểu học) — dùng
  làm ảnh minh hoạ cho trường này sẽ **gây hiểu lầm** (trông như xác nhận
  sự kiện/con người có thật liên quan tới trường, trong khi không phải).
  **Quyết định: KHÔNG ép dùng ảnh sai ngữ cảnh** — giữ nguyên
  `ImagePlaceholder` gradient hiện tại (đã thiết kế đẹp, đúng thương hiệu,
  không phải trông "hỏng"). Muốn có ảnh thật, 2 hướng: (a) người dùng tự
  upload ảnh thật của trường qua `admin/media`, hoặc (b) nếu có tài khoản
  Pexels/Unsplash API (cần đăng ký lấy key, khác Wikimedia Commons) thì có
  thể lấy ảnh minh hoạ chung chung (không gắn với sự kiện/người có thật cụ
  thể) an toàn hơn nhiều.

**Trang 404/lỗi tuỳ chỉnh theo thương hiệu:**
- `src/app/(site)/not-found.tsx` — 404 có Header/Footer (Next.js tự dùng
  file này cho `notFound()` gọi từ trang con trong `(site)`, VD bài
  viết/ngành/giảng viên không tồn tại).
- `src/app/not-found.tsx` — 404 gốc, dùng khi URL không khớp route nào
  trong toàn app (gõ nhầm địa chỉ) — **cố ý đứng độc lập, không gọi
  data layer/DB**, phải luôn hiển thị được kể cả khi tầng dữ liệu có sự cố.
- `src/app/error.tsx` — error boundary gốc bắt lỗi runtime không lường
  trước, bắt buộc là Client Component theo yêu cầu Next.js, có nút "Thử
  lại" (`reset()`) và "Về trang chủ".

**CSP (Content-Security-Policy) — bật thật, đã test kỹ thay vì để trống
như lần trước:**
- `next.config.js` — CSP chặt: `script-src`/`style-src` giữ
  `'unsafe-inline'` (Next.js App Router tự chèn `<script>` inline không
  nonce để hydrate RSC streaming — không tránh được nếu không dựng hẳn
  cơ chế nonce qua proxy.ts, việc lớn hơn để dành sau), còn lại (`img-src`,
  `font-src`, `connect-src`, `frame-ancestors`, `object-src`...) đều giới
  hạn `'self'`. An toàn để làm vậy vì site **không dùng
  `dangerouslySetInnerHTML` hay embed iframe ở đâu cả**.
- `'unsafe-eval'` trong `script-src` **chỉ thêm khi
  `NODE_ENV !== "production"`** — phát hiện khi test: React dev mode dùng
  `eval()` để dựng stack trace debug (React tự khẳng định không bao giờ
  dùng ở production), thiếu dòng này thì console dev đầy cảnh báo vô hại
  nhưng gây nhiễu.
- **next.config.js đổi KHÔNG tự áp dụng qua HMR** — phải tắt hẳn rồi chạy
  lại `npm run dev` mới thấy header mới, đã gặp thật lúc test (phải nhắc
  người dùng restart 2 lần).
- Đã test qua trình duyệt thật (tab mới, tránh nhiễu console cũ): Trang
  chủ, trang 404, đăng nhập admin (Server Action POST), Dashboard — không
  còn cảnh báo CSP nào. **Chưa test được với `npm run build` production
  thật** (sandbox này không chạy build được — xem mục 9 "Lưu ý môi trường
  phát triển đặc biệt") — nên xác nhận lại 1 lần bằng build thật + mở
  DevTools Console trước khi yên tâm hoàn toàn.

**Hạ tầng gửi email — Resend (miễn phí, không thẻ tín dụng, cùng tinh
thần với DeepL):**
- `src/lib/email.ts` — `sendEmail()` + `escapeHtml()` (dữ liệu người dùng
  nhập chèn thẳng vào email HTML, phải escape). Thiếu `RESEND_API_KEY` thì
  im lặng bỏ qua, không throw — không được để thiếu cấu hình email làm
  hỏng luồng chính (đăng ký/liên hệ/quên mật khẩu).
- **Email báo hồ sơ/tin nhắn mới** — `api/admissions/route.ts` và
  `api/contact/route.ts` gửi email tới `site_settings.email` ngay sau khi
  lưu DB thành công.
- **"Quên mật khẩu" cho admin** (`admin/quen-mat-khau` →
  `admin/dat-lai-mat-khau`) — `src/lib/actions/password-reset-actions.ts`.
  Token đặt lại dùng lại đúng cơ chế HMAC như session
  (`signResetToken`/`verifyResetToken` trong `auth.ts`) nhưng **namespace
  riêng** (tiền tố `"reset:"` khi ký) để không lẫn với session thật, hết
  hạn sau 30 phút. Bước 1 **luôn trả về đúng 1 thông điệp chung** dù email
  có tồn tại hay không (chặn user enumeration — đã test cả 2 trường hợp
  cho ra cùng 1 câu). Có rate-limit theo IP lẫn email giống `loginAction`.
  `proxy.ts` phải thêm 2 route này vào danh sách không cần đăng nhập
  (`PUBLIC_ADMIN_PATHS`), không thì tự redirect vòng về đăng nhập.

**Google Analytics — chỉ gắn code, người dùng tự tạo tài khoản (xem hướng
dẫn ở mục 9):**
- `src/components/GoogleAnalytics.tsx` (`next/script`) — chỉ render khi có
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`. `next.config.js` chỉ nới CSP cho
  domain `googletagmanager.com`/`google-analytics.com` **khi biến này có
  giá trị** — chưa gắn GA thì CSP không tự mở domain ngoài cho tính năng
  chưa dùng.

### Phản hồi sau khi xem demo — nút chuyển banner tay + Sự kiện thiếu trang chi tiết
Người dùng tự xem giao diện với dữ liệu demo, phát hiện 2 vấn đề thật:

- **Banner Trang chủ không có nút tự bấm chuyển ảnh** — trước đó chỉ có
  chấm tròn (dot) bấm được + tự động xoay 5s/lần, không có mũi tên
  trái/phải rõ ràng. Đã thêm 2 nút mũi tên `←`/`→` 2 bên banner
  (`HeroImageCarousel.tsx`), style trong suốt/backdrop-blur giống nút dot.
- **Sự kiện không có trang chi tiết để bấm vào xem** — khác hẳn Bài viết
  (đã có `/tin-tuc/[slug]` từ lâu), card Sự kiện ở Trang chủ ("Sự kiện sắp
  diễn ra") trước đó chỉ là `<div>` thường, không phải `<Link>`. Vá bằng
  cách dựng hẳn trang chi tiết thật (nhất quán với Bài viết/Ngành đào
  tạo/Giảng viên, không phải chỉ trỏ tạm về trang danh sách):
  - Thêm cột `events.slug` (nullable — bảng đã có dữ liệu lúc thêm cột,
    cùng lý do kỹ thuật với `faculty.slug`/`programs`, xem mục 5 "Trang
    chi tiết giảng viên"). `admin/su-kien` tự sinh slug lúc **tạo mới**,
    **sửa không đổi slug** (đúng quy ước đã áp dụng cho Bài viết/Danh mục).
  - `getEventBySlug()` mới trong `src/lib/data/events.ts`.
  - `src/app/(site)/su-kien/[slug]/page.tsx` — trang chi tiết thật (giờ/địa
    điểm, ảnh bìa, mô tả Markdown đầy đủ).
  - Card Sự kiện ở Trang chủ và trang `/su-kien` giờ đều là `<Link>` trỏ
    `/su-kien/{slug}` (fallback về `<div>` thường nếu slug null — dữ liệu
    cũ trước migration, dù thực tế luôn có slug qua backfill).
  - Thêm `/su-kien/{slug}` vào `sitemap.ts`.

### Mở rộng hiệu ứng + trang trí ra toàn bộ trang con (hết "rời rạc")
Người dùng hỏi thẳng "web có rời rạc không" — rà soát code xác nhận **có
thật**: Trang chủ có đầy đủ hiệu ứng cuộn (`Reveal`) + gradient blur trang
trí phía sau, nhưng toàn bộ 18 trang con khác (Ngành đào tạo, Tin tức, Sự
kiện, Giới thiệu, Liên hệ, FAQ, Thư viện, Tuyển sinh, Tra cứu, Công khai,
Đội ngũ giảng viên, Chính sách bảo mật, LMS — cả danh sách lẫn chi tiết)
**hoàn toàn tĩnh, không hiệu ứng, không trang trí gì** — đúng là lệch hẳn
độ hoàn thiện thị giác so với Trang chủ.

- **`src/components/site/DecorativeSection.tsx`** (mới) — khung dùng
  chung cho MỌI trang con: `<section relative overflow-hidden px-6 py-20
  sm:px-8>` + 2 khối gradient blur góc (`bg-brand-500/15`/`bg-accent-500/10`,
  `blur-[60px]`, đúng công thức Hero Trang chủ đang dùng) + bọc nội dung
  trong `<Reveal className="relative ...">` (bắt buộc thêm `relative` để
  nội dung tĩnh nổi lên trên các khối blur `absolute` — thiếu dòng này nội
  dung sẽ bị blur đè lên, đã tái hiện đúng lỗi CSS stacking này lúc làm).
- Áp dụng cho toàn bộ 18 trang con — thay `<section className="px-6 py-20
  sm:px-8"><div className="mx-auto max-w-...">...</div></section>` bằng
  `<DecorativeSection contentClassName="mx-auto max-w-...">...</DecorativeSection>`.
  **Không dùng `className` để đổi `py-*`** (VD `lms/page.tsx` cũ có
  `py-24` khác các trang khác) — `cn()` trong dự án chỉ nối chuỗi thuần,
  2 class cùng thuộc tính cùng áp dụng không rõ class nào thắng trên CSS
  sinh ra (khác `tailwind-merge`) — chấp nhận đồng bộ về `py-20` chung
  luôn, đơn giản hơn và tăng tính nhất quán.
- **Khi thêm trang công khai mới trong `(site)`, luôn dùng
  `DecorativeSection` làm khung ngoài cùng** thay vì tự viết
  `<section className="px-6 py-20 sm:px-8">` trần — trừ Trang chủ (đã có
  bố cục riêng nhiều khối, tự quản blur/Reveal theo từng khối).

### "Vẫn đơn điệu" — Reveal đổi sang mượt liên tục theo cuộn + so le từng thẻ
> **ĐÃ THAY THẾ (02/10/2026)** — cơ chế "bám % vị trí cuộn" mô tả dưới đây không còn
> dùng; `Reveal` giờ chạy theo thời gian kiểu WOW.js của VinUni, xem mục 5 "Chữ chạy
> lên khi cuộn tới (kiểu VinUni)". Giữ lại để hiểu lịch sử.

Sau khi mở rộng hiệu ứng ra trang con, người dùng vẫn thấy đơn điệu — đúng,
vì `Reveal` bản đầu chỉ có **1 kiểu** (mờ/trượt) và bật/tắt **nhị phân**
(chưa thấy = ẩn hẳn, vừa thấy = hiện hẳn), dùng giống hệt nhau ở mọi nơi —
không phải cảm giác "mượt theo tay cuộn" thật sự.

- **`Reveal.tsx` viết lại theo cơ chế mượt liên tục**: thay vì
  `IntersectionObserver` bật 1 state boolean, giờ tính `progress` (0→1)
  liên tục dựa trên `getBoundingClientRect()` thật của phần tử so với
  khung nhìn — mờ dần/trượt lên bám sát ĐÚNG vị trí cuộn hiện tại, không
  còn giật theo bậc. Để tránh mỗi `Reveal` (có hàng chục cái/trang) đều có
  1 scroll listener chạy suốt vòng đời trang (tốn hiệu năng),
  `IntersectionObserver` giờ CHỈ dùng để bật/tắt 1 scroll listener khi
  phần tử đang ở gần khung nhìn (`rootMargin: "15% 0px 15% 0px"`) — scroll
  listener throttle qua `requestAnimationFrame`, tắt hẳn khi phần tử ra
  khỏi vùng gần khung nhìn hoặc đã hiện đủ 100%.
- **`delay` (ms) đổi ý nghĩa** — trước là `transitionDelay` CSS thuần, giờ
  KHÔNG còn CSS `transition` nào cả (progress bám 1:1 theo scroll, không
  qua transition) nên `delay` được quy đổi thành khoảng cách cuộn cần đi
  thêm (`delayPx = delay * 0.35`) — dùng để **so le nhiều thẻ trong 1
  lưới/danh sách** (VD `delay={i * 80}` cho từng thẻ ngành đào tạo) mà độ
  so le vẫn khớp đúng tốc độ tay cuộn thật, không phải hẹn giờ tách rời
  khỏi cuộn.
- **Tôn trọng `prefers-reduced-motion`** — kiểm tra trong effect (không
  đọc `window.matchMedia` lúc render vì SSR không có `window`, dễ gây
  hydration mismatch), tắt hẳn hiệu ứng nếu người dùng bật cờ này trong hệ
  điều hành.
- **Đã áp dụng so le cho mọi khối lưới/danh sách nhiều mục** — mỗi thẻ bọc
  riêng `<Reveal delay={i * Nms}>` thay vì cả khối bọc chung 1 `Reveal`
  (khác cách cũ khiến cả khối bật lên cùng lúc, đơn điệu): Trang chủ (Ngành
  đào tạo, Đối tác, 4 chỉ số, 3 điểm mạnh, 4 bước quy trình, Thư viện
  bento, Giảng viên, Đánh giá cựu SV, Sự kiện, Tin tức) + 6 trang con
  (`/nganh-dao-tao`, `/doi-ngu-giang-vien`, `/thu-vien`, `/faq`,
  `/tin-tuc`, `/su-kien`). Reveal lồng trong Reveal (khối cha vẫn bọc
  Reveal cho tiêu đề, khối con mỗi thẻ 1 Reveal riêng) hoạt động bình
  thường — mỗi Reveal độc lập, không xung đột.
- **Hạn chế đã biết**: sandbox môi trường code không composite khung hình
  (`document.visibilityState === "hidden"`, xem mục 9) nên
  `IntersectionObserver` không bao giờ bắn được trong lúc test —
  **không tự mắt kiểm tra được cảm giác mượt-theo-cuộn thật sự trong
  sandbox này**, chỉ verify được: build sạch, không lỗi console, và cơ chế
  hẹn giờ dự phòng 2s vẫn hoạt động đúng (test được vì không phụ thuộc
  compositing). Cần người dùng tự xem trên trình duyệt thật.
- **Còn chưa làm** (người dùng chưa chọn ở lượt hỏi phạm vi): hiệu ứng
  chiều sâu khi cuộn (parallax nhẹ cho khối blur trang trí) và tương tác
  khi rê chuột (spotlight theo con trỏ trên thẻ, hiệu ứng quét sáng nút
  CTA) — 2 hướng đã đề xuất nhưng chưa triển khai, cân nhắc làm tiếp nếu
  người dùng vẫn muốn thêm sau khi xem 2 hướng đã làm.

### 2 hướng hiệu ứng còn lại — parallax + tương tác rê chuột (XONG)
Người dùng xác nhận làm nốt cả 2 hướng đã đề xuất ở trên trước khi chuyển
sang PostgreSQL:

- **`src/components/site/ParallaxBlur.tsx`** (mới) — bọc 1 khối blur trang
  trí để nó di chuyển LỆCH TỐC ĐỘ so với nội dung khi cuộn (tạo chiều sâu
  nhẹ). Cùng cơ chế hiệu năng với `Reveal.tsx`: `IntersectionObserver` chỉ
  bật/tắt 1 scroll listener khi khối đang gần khung nhìn, throttle qua
  `requestAnimationFrame`, tôn trọng `prefers-reduced-motion`. Đã áp dụng
  cho 2 khối blur trong `DecorativeSection.tsx` (dùng chung 18 trang con)
  + 3 khối blur riêng của Trang chủ (Hero 2 khối, Thư viện bento 1 khối).
- **`src/components/site/ProgramCard.tsx`** (mới) — gộp markup thẻ ngành
  đào tạo từng lặp lại gần giống hệt ở Trang chủ và `/nganh-dao-tao` thành
  1 component dùng chung, đồng thời thêm hiệu ứng **spotlight** theo con
  trỏ chuột (`onMouseMove` cập nhật CSS custom property `--spot-x`/`--spot-y`,
  1 lớp phủ `radial-gradient` chỉ CSS thuần hiện khi hover). Phải là Client
  Component (`"use client"`) vì cần gắn `onMouseMove` — Server Component
  không gắn được sự kiện DOM. **Lưu ý**: Trang chủ trước đây dùng bản thẻ
  RÚT GỌN hơn (không hiện thời lượng/chỉ tiêu), `/nganh-dao-tao` dùng bản
  ĐẦY ĐỦ — gộp chung theo bản đầy đủ (chấp nhận Trang chủ hiện thêm 2 dòng
  thông tin, đổi lấy không trùng lặp code).
- **`src/components/ui/Button.tsx`** — biến thể `primary` (dùng cho mọi
  CTA chính, VD "Đăng ký xét tuyển") thêm hiệu ứng **quét sáng chéo** khi
  hover — thuần CSS qua pseudo-element `::before` (`before:content-['']`
  + `before:-skew-x-[20deg]` + `hover:before:translate-x-[350%]`), không
  cần JS. Vệt sáng bán trong suốt (`bg-white/30`) đi qua cả chữ là hiệu
  ứng CHỦ ĐÍCH (giống hiệu ứng "sheen" hay thấy ở nút CTA cao cấp), không
  phải lỗi z-index cần sửa.
- **Hạn chế test giống hệt Reveal/CSP trước đó**: sandbox không composite
  khung hình nên `ParallaxBlur` không tự mắt verify được chuyển động thật
  lúc cuộn — chỉ verify được: build sạch, không lỗi console, thẻ ngành
  render đúng đủ 6 mục, spotlight CSS var cập nhật đúng khi giả lập
  `mousemove` qua JS (`--spot-x`/`--spot-y` đổi giá trị theo toạ độ), nút
  CTA có đủ class quét sáng. Cần người dùng tự xem cảm giác cuộn/hover
  thật trên trình duyệt thật.

### 3 nâng cấp sau khi đối chiếu với website trường khác (hmu.edu.vn, cdyduochanoi.edu.vn, cdyduocsaigon.edu.vn)
Người dùng nhờ tham khảo website các trường (1 trường lớn + 2 trường cao
đẳng cùng tầm) để tìm việc cần bổ sung. Phần lớn khoảng cách chỉ là NỘI
DUNG (Cơ cấu tổ chức, Thông điệp Hiệu trưởng, Cựu sinh viên... admin tự
tạo được ngay qua `admin/trang-tinh`, không cần code) — 3 mục dưới đây là
phần thật sự cần code, người dùng chọn làm cả 3:

- **Video trong Thư viện** (`gallery_items.video_url`, nullable) — trước
  đây thư viện chỉ nhận ảnh dù tiêu đề trang đã ghi "Ảnh & video". Có
  `video_url` (dán link YouTube) thì `image_url` đóng vai trò ảnh
  bìa/thumbnail, phủ icon Play qua component dùng chung
  `src/components/site/GalleryMedia.tsx` — bấm vào mở video ở tab mới
  (`target="_blank"`), **không** nhúng iframe/modal để giữ đơn giản, không
  thêm state client. Dùng chung ở cả bento Trang chủ và `/thu-vien`.
- **Đăng ký nhận bản tin** (bảng mới `newsletter_subscribers`: `email`
  unique + `created_at`) — form nhỏ ở `SiteFooter.tsx`
  (`NewsletterForm.tsx`, cùng pattern honeypot + rate limit với
  `ContactForm.tsx`) POST tới `/api/newsletter`. **Không** gửi email báo
  admin mỗi lượt đăng ký (khác `/api/contact`, `/api/admissions`) — đây
  không phải việc cần xử lý gấp, tránh spam hộp thư admin. Admin xem/xoá
  qua `admin/dang-ky-nhan-tin` (module quyền dùng chung key
  `"admissions-contact"` với Tuyển sinh/Liên hệ/Liên hệ nhanh — không tách
  module quyền riêng cho 1 danh sách nhỏ), có nút "Sao chép danh sách
  email" (`CopyEmailsButton.tsx`, client component, copy nối bằng dấu phẩy
  vào clipboard) để dán qua Gmail/Outlook gửi hàng loạt thủ công — không
  tự làm tính năng gửi bản tin hàng loạt (quá phạm vi, người dùng chưa cần).
- **Ghim bài viết làm "Thông báo"** (`posts.is_pinned`, integer 0/1) —
  cdyduocsaigon tách hẳn khối "THÔNG BÁO" khỏi Tin tức thường (lịch nghỉ,
  tuyển dụng...) để nổi bật hơn. Thêm checkbox "Ghim làm Thông báo nổi bật"
  trong form `admin/bai-viet` (áp dụng được cả lúc tạo lẫn sửa, khác cờ
  đăng/nháp vốn chỉ đổi qua nút riêng ở danh sách — ghim chỉ là thuộc tính
  nội dung, không phải trạng thái workflow). `getPinnedPosts()` trong
  `src/lib/data/posts.ts` lấy bài đã đăng + đã ghim, Trang chủ hiện 1 khối
  danh sách gọn ngay trên khối Tin tức (chỉ hiện khi có ít nhất 1 bài ghim).

### Đánh giá rủi ro traffic lớn/spam + vá 6 điểm
Người dùng hỏi thẳng: deploy lên rồi nhiều người dùng cùng lúc hoặc bị spam
thì có gặp trục trặc gì không. Rà lại code thật (không đoán) rồi vá hết
những gì sửa được ngay, phần còn lại là quyết định hạ tầng (không phải lỗi
code) thì ghi rõ ra thay vì im lặng bỏ qua:

- **Bật WAL mode cho SQLite** (`src/lib/db/client.ts`) — mặc định SQLite
  dùng rollback journal, khoá CẢ đọc lẫn ghi trong lúc có 1 lượt ghi đang
  chạy (rủi ro thật ở cao điểm tuyển sinh, nhiều người cùng submit hồ sơ).
  Thêm `PRAGMA journal_mode = WAL` + `PRAGMA busy_timeout = 5000` ngay sau
  khi tạo client — WAL cho đọc song song lúc đang ghi, busy_timeout giúp 2
  lượt ghi hiếm khi trùng nhau tự đợi thay vì lỗi `SQLITE_BUSY` ngay lập
  tức. Chỉ là giảm nhẹ rủi ro — **không thay thế** việc chuyển hẳn sang
  PostgreSQL (mục 4.4), SQLite vẫn giới hạn 1 writer tại 1 thời điểm dù có
  WAL. Bắn pragma 1 lần lúc khởi động tiến trình (không await ở top-level,
  lỗi bị nuốt im lặng — an toàn nếu sau này `DATABASE_URL` trỏ sang nguồn
  không hỗ trợ pragma này).
- **Giới hạn độ dài field text ở form public** (`src/lib/validate.ts`,
  `findOversizedField()`) — trước đây `fullName`/`phone`/`note`/`message`
  không giới hạn độ dài, 1 request có thể gửi field dài bất thường dù đã bị
  rate-limit theo SỐ LẦN gửi (2 lớp bổ sung nhau, không thay thế nhau). Áp
  dụng cho `/api/admissions`, `/api/contact`, `/api/newsletter`, và cap độ
  dài CCCD ở `/api/admissions/tra-cuu`.
- **Cloudflare Turnstile** (`src/lib/turnstile.ts`,
  `src/components/site/TurnstileWidget.tsx`) — lớp chống bot/spam mạnh hơn
  honeypot, cùng tinh thần "dịch vụ ngoài miễn phí, không bắt buộc" như
  DeepL/Resend/GA: chưa cấu hình `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/
  `TURNSTILE_SECRET_KEY` thì `TurnstileWidget` trả `null` (form không hiện
  gì thêm) và `verifyTurnstileToken()` luôn trả `true` (bỏ qua kiểm tra) —
  form vẫn hoạt động bình thường, chỉ dựa vào honeypot như trước. Gắn vào
  cả 3 form public (`AdmissionForm`, `ContactForm`, `NewsletterForm` —
  riêng Newsletter dùng `data-size="compact"` cho vừa cột Footer hẹp).
  CSP (`next.config.js`) chỉ nới domain `challenges.cloudflare.com` khi
  thực sự có cấu hình (biến `hasTurnstile`, cùng cách làm với `hasGA`).
- **Phân trang `/tin-tuc`** (`getPublishedPostsPage()` trong
  `src/lib/data/posts.ts`, 12 bài/trang) — trước lấy TOÀN BỘ bài đã đăng
  trong 1 query không giới hạn, càng nhiều bài viết theo thời gian thì mỗi
  lượt tải trang càng nặng dần. Dùng `COUNT(*)` riêng + `LIMIT`/`OFFSET`
  (không phải lấy hết rồi cắt mảng ở code) để thực sự giảm dữ liệu đọc mỗi
  request. `getAllPublishedPosts()` (không phân trang) giữ nguyên, vẫn cần
  cho `sitemap.ts` (bắt buộc liệt kê đủ mọi bài).
- **Không tự sửa, chỉ ghi rõ ra** (cần người dùng quyết định hạ tầng, xem
  mục 8): rate limit đang lưu trong bộ nhớ (`Map`, `src/lib/rate-limit.ts`)
  — nếu deploy nhiều instance (serverless nhiều vùng, hoặc PM2 cluster
  nhiều process) thì mỗi instance có bộ đếm riêng, giới hạn thực tế lỏng
  hơn số khai báo; và `public/uploads/` là filesystem cục bộ — deploy
  serverless (Vercel) sẽ mất file khi khởi động lại instance, chỉ ổn khi
  deploy VPS/server chạy 1 tiến trình dài hạn (đã có kế hoạch chuyển S3
  cùng lúc với Postgres ở mục 4.4/4.1c).

### Đánh giá thiết kế web + admin lần 2 + tệp đính kèm cho Bài viết
Người dùng nhờ đánh giá lại xem giao diện web/admin đã ổn chưa trước khi
chuyển Postgres. Duyệt qua browser thật (đăng nhập admin, cả desktop lẫn
mobile viewport) + đọc code, tìm được và vá hết các mục sau:

- **Dashboard admin không actionable** (`admin/page.tsx`) — trước đây 4 KPI
  chỉ là số tĩnh, không bấm được, "Hồ sơ tuyển sinh mới: 1" nhưng phải tự đi
  tìm trong sidebar. Giờ mỗi KPI là `<Link>` trỏ thẳng trang xử lý tương
  ứng, 2 KPI "mới" (tuyển sinh/liên hệ) tô màu accent khi > 0 để dễ nhận ra
  cần xử lý; thêm KPI "Đăng ký nhận tin" (bỏ sót khi làm tính năng
  newsletter); "Bài viết gần đây" giờ bấm vào là mở thẳng form sửa; thêm nút
  tắt "+ Viết bài mới" đầu trang.
- **Admin không responsive trên di động** — `AdminSidebar.tsx` trước đây cố
  định `w-64` (256px), không breakpoint nào, vỡ layout hoàn toàn trên điện
  thoại. Chuyển sang mô hình drawer trượt chuẩn: `AdminMobileMenuContext.tsx`
  (mới) — Context chia sẻ trạng thái đóng/mở giữa `AdminSidebar` (đọc để
  hiện/ẩn) và `AdminTopbar` (giờ là Client Component, có nút ☰ để bật) vì 2
  component này nằm ở 2 nhánh khác nhau trong cây (`AdminTopbar` nằm sâu
  trong từng `page.tsx`, không thể truyền prop qua ~25 trang). Sidebar dùng
  `fixed ... -translate-x-full` (ẩn ngoài màn hình bên trái) mặc định, bấm
  ☰ thêm class `translate-x-0` (trượt vào) + lớp phủ đen `fixed inset-0`
  đằng sau (bấm ra ngoài để đóng); từ `lg:` trở lên dùng lại `lg:sticky
  lg:translate-x-0` y hệt hành vi cũ (không đổi gì trên desktop). Tự đóng
  drawer khi đổi trang (`useEffect` theo `pathname`). **Lưu ý khi test**:
  hiệu ứng trượt (CSS transition) không tự mắt kiểm tra được trong sandbox
  này vì `document.visibilityState === "hidden"` khiến trình duyệt tạm
  dừng animation của tab ẩn — đã verify đúng bằng cách khác: class list
  đổi đúng lúc bấm ☰, `--tw-translate-x` đổi đúng giá trị, overlay ẩn/hiện
  đúng, tự đóng đúng khi bấm ra ngoài — chỉ riêng phần "mượt" của chuyển
  động là chưa tự mắt xem được, cần người dùng tự thử trên điện thoại thật.
- **Cảnh báo nội dung "chưa điền" trong `admin/trang-tinh`** — các trang
  "3 công khai"/Giới thiệu/Liên hệ được seed sẵn ghi chú dạng
  `[Trường điền: ...]` (đúng chủ đích — không tự bịa số liệu chính thức),
  nhưng nếu quên thay trước khi launch thì khách xem web sẽ thấy nguyên văn
  ngoặc vuông, trông như site lỗi. Thêm `hasPlaceholder()` (regex
  `/\[[^\]]{2,}\]/`) hiện badge "⚠️ Chưa điền" ở danh sách + cảnh báo ngay
  trong form khi đang sửa trang có placeholder — không tự động ẩn/xoá gì,
  chỉ nhắc admin nhớ điền trước khi công khai thật.
- **Tệp đính kèm cho Bài viết** (`posts.attachment_url`,
  `posts.attachment_name`) — người dùng nhận xét nhiều trường có thông
  báo kèm tài liệu (quyết định, biểu mẫu...) mà site chưa có. Mở rộng
  `src/lib/media.ts`: thêm `ALLOWED_DOCUMENT_TYPES` (PDF/Word/Excel, tối
  đa 20MB) + `type: "document"` cho `media_items` (trước chỉ "image" |
  "video"). Admin `bai-viet` thêm field "Tệp đính kèm" — upload xong lưu
  `attachmentName` = TÊN GỐC của file (không phải tên đã lưu trên đĩa, vốn
  bị thêm tiền tố timestamp nên không đẹp để hiện cho khách) để hiện link
  tải dễ đọc; có tick "Xoá" để gỡ tệp đính kèm hiện tại. Web công khai:
  trang chi tiết `/tin-tuc/[slug]` hiện khối link tải "📎 Tài liệu đính
  kèm", khối "Thông báo" ở Trang chủ hiện icon 📎 cạnh tiêu đề nếu bài có
  đính kèm (đúng use-case người dùng mô tả — thông báo có tài liệu kèm
  theo). Không làm thư viện tài liệu riêng (khác với "Thư viện điện tử" đã
  hoãn cùng LMS) — đây chỉ là 1 file đính kèm/1 bài viết, đơn giản hơn
  nhiều và giải quyết đúng nhu cầu "thông báo có đính kèm" người dùng nêu.
- **Cân nhắc nhưng KHÔNG làm**: phân trang cho `/su-kien` và `/thu-vien`
  (gallery) — khác với `/tin-tuc` (bài viết tăng nhanh theo thời gian, đã
  phân trang ở đợt trước), sự kiện và ảnh thư viện thường tăng chậm hơn
  nhiều ở quy mô 1 trường, chưa thấy rủi ro thật để đánh đổi thêm phức tạp
  ngay bây giờ — để dành làm sau nếu thực tế thấy 2 danh sách này phình to.

### Đợt "pro hơn + 3D" (01/10/2026) — tham khảo trường y dược VN + CMS chuẩn
Người dùng nhờ đánh giá lại, đối chiếu dự án tương tự (duochn.edu.vn,
tuetinh.edu.vn, các mẫu đoạt giải trên Concept3D/Webby/Awwwards; CMS
Strapi/Directus/Payload) rồi chọn qua `AskUserQuestion` **toàn bộ** các hạng
mục dưới đây. Đã test qua trình duyệt thật (desktop + mobile 375px):

- **Cảnh 3D bằng Canvas tự viết** (`src/components/site/DnaScene3D.tsx`, prop
  `theme="light" | "dark"`) — người dùng chọn phương án này thay vì
  three.js/WebGL (không thêm dependency). Chuỗi xoắn DNA + phân tử + vòng quỹ
  đạo + bụi sáng, phép chiếu phối cảnh tự viết, quả cầu vẽ từ sprite dựng sẵn.
  Nghiêng theo chuột (chỉ thiết bị có chuột), xoắn thêm theo cuộn. Vẽ ngay 1
  khung tĩnh lúc mount (đúng bài học "hẹn giờ dự phòng" — không phụ thuộc
  rAF), chỉ chạy vòng lặp khi trong khung nhìn + tab hiện,
  `prefers-reduced-motion` → khung tĩnh. Component bọc canvas trong div
  (canvas là phần tử "replaced", absolute + inset không tự giãn) — đặt vị
  trí/kích thước ở `className`, đừng đặt trên canvas. **Vị trí hiện tại: khối
  nền tối "Vì sao chọn Hợp Lực" giữa Trang chủ** (xem mục "Banner lớn + dời
  3D" ngay dưới) — ban đầu đặt ở Hero nhưng người dùng muốn banner ảnh lớn.
- **`TiltCard`** (`src/components/site/TiltCard.tsx`) — tổng quát hoá hiệu ứng
  nghiêng 3D của `ProgramCard` + vệt sáng glare; con có class `tilt-pop` nổi
  lên (translateZ) khi hover. Dùng ở thẻ "Vì sao chọn", giảng viên, tin tức,
  sự kiện (Trang chủ) và phương thức xét tuyển. CSS ở `globals.css` mục
  `.tilt-3d` — chỉ bật với chuột + không giảm chuyển động.
- **Chuyển trang mượt** — `src/app/(site)/template.tsx` bọc `<ViewTransition
  enter="page-enter" exit="page-exit">` (React canary có sẵn trong Next 16,
  không cần cấu hình), header neo cố định qua `viewTransitionName:
  "site-header"`. Đã xác nhận `document.startViewTransition` được gọi khi bấm
  link. `<html data-scroll-behavior="smooth">` để Next tắt cuộn mượt lúc
  chuyển trang (hết cảnh báo console).
- **Mega menu** — danh mục to có ≥ `MEGA_MIN_CHILDREN` (4) mục con hiện lưới
  2 cột + mô tả ngắn + khối CTA tuyển sinh; ít hơn thì dropdown gọn. Cột mới
  `nav_items.description`/`description_en` (admin/menu có ô "Mô tả ngắn"),
  seed tự ghép "Mã {code} · {duration}" cho mục con trỏ tới ngành. Hiệu ứng
  trượt dùng CSS `translate` (không phải `transform`) để không đè
  `-translate-x-1/2` của Tailwind.
- **Tìm kiếm toàn site** — `/tim-kiem` + `src/lib/data/search.ts`
  (`searchSite`): ngành, bài đã đăng, sự kiện, giảng viên, trang tĩnh có
  route công khai, FAQ. Tìm **không dấu** (`normalizeSearch` trong utils), mọi
  từ phải có (AND), khớp nguyên cụm từ được ưu tiên, tô đậm đúng trên chữ có
  dấu (bảng ánh xạ vị trí). Trang `noindex`. Header có nút kính lúp + phím
  tắt "/" hoặc Ctrl+K. **Bài học thật**: đừng đóng panel tìm kiếm trong
  `onSubmit` — React gỡ form khỏi DOM trước khi trình duyệt kịp gửi; panel
  đóng theo URL (`searchOpenAt === pathname`). Dùng `next/form` để gửi
  bằng điều hướng client (có View Transition).
- **Thanh CTA dính đáy mobile** (`MobileActionBar.tsx`, chỉ `< lg`) — Gọi /
  Zalo (chưa cấu hình thì thay bằng Tra cứu) / Đăng ký. `(site)/layout.tsx`
  thêm `pb-[76px] lg:pb-0`; `QuickContactWidget` nâng lên `bottom-[92px]`
  trên mobile để không chồng.
- **Tuyển sinh rõ ràng hơn** — bảng mới **`admission_items`** (discriminator
  `type`: `timeline`/`method`/`document`, cột `meta` = thời gian), admin
  `admin/thong-tin-tuyen-sinh` (khối Tuyển sinh & Liên hệ), data layer
  `src/lib/data/admission-info.ts`. Cột mới **`programs.tuition`/`tuition_en`**
  (text tự do, để trống → web hiện "Liên hệ"). `/tuyen-sinh` dựng lại: dòng
  thời gian, phương thức, hồ sơ dạng checklist, bảng chỉ tiêu + học phí,
  form dính bên phải (desktop). **Mốc thời gian seed cố ý là placeholder
  `[Trường điền: …]`** — data layer KHÔNG BAO GIỜ trả placeholder ra web công
  khai (thời gian → `null` → hiện "Đang cập nhật"; tiêu đề còn placeholder →
  ẩn cả mục), admin thấy cảnh báo "⚠️ Chưa điền". Hồ sơ/phương thức seed là
  danh sách phổ biến khối cao đẳng — **trường cần rà lại trước khi công bố**.
  `DecorativeSection` đổi `overflow-hidden` → **`overflow-clip`** (vẫn cắt blur
  nhưng không tạo vùng cuộn) — nếu không, `sticky` bên trong không dính.
- **Admin — sidebar**: `ADMIN_NAV` thêm trường `section` (Nội dung / Đào tạo /
  Tuyển sinh / Giao diện / Hệ thống) chỉ để hiện tiêu đề nhóm — **cấu trúc
  khối thực thể giữ nguyên**, module phân quyền không đổi. Icon vẽ inline ở
  `AdminIcon.tsx` theo key entity (key chưa có icon → chấm tròn). Badge đỏ số
  hồ sơ/tin nhắn mới (đếm ở `admin/(dashboard)/layout.tsx`, chỉ khi có quyền).
- **Admin — bảng lệnh Ctrl+K / "/"** (`AdminCommandPalette.tsx`, provider bọc
  layout; Sidebar/Topbar mở qua `useCommandPalette()`): nhảy tới trang + thao
  tác nhanh + tìm bản ghi qua `adminSearchAction`
  (`src/lib/actions/admin-search-actions.ts`) — **chỉ trả nhóm thuộc module
  được cấp quyền**. Topbar giờ sticky + nhận prop `actions` cho nút riêng
  của trang.
- **Admin — Dashboard mới**: lời chào, KPI có xu hướng 7 ngày + sparkline,
  biểu đồ cột hồ sơ 30 ngày, hồ sơ theo ngành, "Việc cần xử lý" (hồ sơ/tin
  nhắn mới, bài nháp, trang/thông tin tuyển sinh còn placeholder, ngành chưa
  có học phí, chưa có banner). Biểu đồ SVG tự vẽ (`DashboardCharts.tsx`),
  không thêm thư viện; mọi query theo quyền.
- **Admin — Xuất Excel**: `GET /admin/tuyen-sinh/xuat-csv` và
  `/admin/lien-he/xuat-csv` (route handler, `requirePermission`), áp dụng
  đúng bộ lọc đang xem (`tuyen-sinh/filter.ts` dùng chung với trang). `src/lib/csv.ts`:
  BOM UTF-8 + CRLF; chặn CSV injection (ô bắt đầu `= + - @` thêm `'`);
  **`digitsCell()` cho SĐT/CCCD** để Excel không xoá số 0 đầu / đổi CCCD
  thành `3,82E+11`.
- **Lỗi thật đã sửa kèm**: 7 shade màu code đã dùng nhưng chưa khai báo
  (`brand-200/300/400`, `accent-50/200/400`) → class không sinh CSS (ô KPI
  "hồ sơ mới" không đổi màu, khối "Thông báo" mất nền) — đã thêm token.
  Giờ `created_at` SQLite (UTC không múi giờ) hiển thị lệch 7 tiếng ở
  `admin/lien-he`/`dang-ky-nhan-tin` — dùng chung `formatDbDateTime()`
  (`utils.ts`, cùng `dbTimestampToISO`/`vnDateKey`). `hasPlaceholder()` chuyển
  vào `utils.ts` và bỏ qua link Markdown `[chữ](url)` (trước báo nhầm).
- Test mới `tests/ui-helpers.test.ts` (CSV, placeholder, tìm không dấu, múi
  giờ) — `npm test` 42/42.
- **Chưa làm / hạn chế**: chưa chạy `npm run build` (dùng tsc + lint + test +
  trình duyệt dev); cảm giác 3D/tilt/chuyển trang mới xác nhận trên Chromium
  dev, chưa thử Safari/Firefox/điện thoại thật. Search lọc trong JS — khi lên
  PostgreSQL có thể đổi sang full-text ngay trong `search.ts`.

### Banner lớn + dời 3D + làm Trang chủ "pro" hơn (01/10/2026, lượt 2)
Người dùng: "banner phải to lên vì nó đại diện của trang, còn 3D đặt chỗ nào
hợp lý, giao diện vẫn chưa thấy pro". Đã làm (test trình duyệt desktop +
mobile 375px, kể cả 2 banner tạm `audit-tmp-*` thêm vào DB dev rồi xoá ngay):

- **`HeroBanner.tsx`** thay `HeroImageCarousel` (đã xoá file): banner **tràn
  toàn màn hình** (desktop `h-[calc(100svh-104px)]` tối đa 880px; mobile cao
  theo nội dung, tối thiểu 640px để chữ không đè thanh điều khiển). Ảnh phủ
  kín + lớp phủ gradient xanh đậm trái/đáy + hạt nhiễu; chữ Hero (CMS) + 2 CTA
  + 2 chỉ số nằm đè bên trái. Nhiều banner: crossfade 1,4s, Ken Burns CSS chạy
  liên tục (không reset scale khi đổi ảnh → không giật), thanh tiến trình từng
  banner, "01 / 03", chú thích + "Xem chi tiết" (= `linkUrl`, ảnh nền không
  còn là link vì đè CTA), nút ←/→/tạm dừng (mobile căn trái — bên phải có nút
  liên hệ nhanh cố định). Thứ tự nguồn ảnh: `hero_banners` → `heroImageUrl` →
  ảnh minh hoạ `/images/3d/medical-learning.webp` (tạm, tới khi có ảnh thật).
  Admin banner có hướng dẫn: ảnh ngang ≥ 1920×1080, chủ thể lệch phải.
- **Công cụ nhanh** thành thanh trắng nổi đè mép dưới banner (`-mt-12`).
- **Đối tác** thành dải chạy ngang vô tận (`.marquee`, lặp danh sách ≥ 8
  mục/nửa rồi nhân đôi, dịch -50%; hover tạm dừng; reduced-motion → đứng yên,
  ẩn bản sao `.marquee-dup`).
- **3D chuyển xuống khối "Vì sao chọn Hợp Lực" nền tối** (gộp 2 khối cũ "4 chỉ
  số" + "3 điểm mạnh"): trái = tiêu đề + 3 điểm mạnh dạng danh sách đánh số;
  phải = `DnaScene3D theme="dark"` với 4 chỉ số thẻ kính tối nổi quanh (mobile:
  lưới 2×2 dưới mô hình). Lý do: các mẫu web đoạt giải dùng 3D tạo không khí
  cho 1 khối kể chuyện, banner đầu trang dành cho ảnh thật.
- Sứ mệnh/Tầm nhìn dạng trích dẫn chữ lớn; **Tin tức + Thông báo gộp 1 khối
  kiểu tạp chí** (1 tin nổi bật ngang lớn + tin nhỏ; bảng Thông báo bên phải
  có ô lịch ngày/tháng); nút "Xem tất cả" dạng viên thuốc (`PillLink`);
  `SectionHeading` to hơn (32→42px, `text-balance`) — áp dụng toàn site.
- Lỗi sửa kèm: `Eyebrow tone="onDark"` dùng `bg-white/12` (không có trong
  thang opacity Tailwind 3 → mất nền) → `bg-white/10` + viền; footer tràn
  ngang ~22px ở khổ ~785px do email không ngắt dòng → `[overflow-wrap:anywhere]`.

### Rà soát trên điện thoại (giả lập 390×844 / 375×667, UA Android + cảm ứng)
- **Danh sách thẻ trên mobile vuốt ngang** (ngành, giảng viên, sự kiện —
  hằng số `MOBILE_SWIPE_ROW`/`MOBILE_SWIPE_ITEM` trong `(site)/page.tsx`,
  snap từng thẻ, thẻ sau lộ 1 phần; từ `sm` trở lại lưới). "4 bước" trên
  mobile thành danh sách số-trái chữ-phải. Trang chủ mobile 13.678px → ~11.100px.
- **`SectionHeading` bỏ `mb-14` mặc định khi `className` có `mb-*`** — trước
  đây truyền `mb-0` không có tác dụng (`cn()` không gộp class, `mb-14` thắng
  trong CSS) → khoảng trống ~80px giữa tiêu đề và nút ở mọi khối. **Bài học
  chung: đừng truyền 2 class cùng thuộc tính rồi trông chờ class sau thắng**
  (cùng nguyên nhân với ô bento `h-[160px]` + `h-full` co thành vạch mỏng —
  bento giờ đặt chiều cao qua `auto-rows-*`).
- **Menu mobile**: tự cuộn trong khung màn hình (`max-h-[calc(100dvh-104px)]`
  — header dính, menu dài hơn màn hình sẽ khuất phần cuối), danh mục to giữ
  dạng danh sách, danh mục phụ thành lưới 2 cột "Khám phá thêm", thẻ gọi
  hotline cuối menu; bỏ nút "Đăng ký" trùng với `MobileActionBar`.
- **Ô nhập ≥ 16px trên màn hình < 640px** (`globals.css`) — Safari iOS tự
  phóng to trang khi chạm ô nhập chữ < 16px.
- **Mở dev trên điện thoại thật**: `next.config.js` có `allowedDevOrigins`
  tự lấy mọi IPv4 LAN của máy (Next 16 mặc định chặn JS/HMR khi truy cập
  bằng IP thay vì localhost → trang hiện nhưng mất hiệu ứng/form). Điện thoại
  cùng mạng mở `http://<IP-máy>:3000`; đổi `next.config.js` phải khởi động lại
  `npm run dev`; Windows Firewall có thể hỏi cho phép Node.js lần đầu. Chưa
  kiểm chứng trên máy thật trong phiên này (máy dev nối Ethernet 10.1.10.x —
  điện thoại phải vào được cùng dải mạng).

### Đợt tham khảo VinUni (02/10/2026)
Người dùng nhờ xem vinuni.edu.vn để cải thiện, chọn qua `AskUserQuestion` 5
hạng mục giao diện (KHÔNG làm nhóm nội dung: cơ sở vật chất, kiểm định, thông
điệp lãnh đạo — tránh bịa nội dung/giá trị cốt lõi cho trường). Đã test trình
duyệt desktop 1280px + mobile 375px:

- **Header trong suốt trên banner** — `SiteHeader.tsx`: chưa cuộn (< 24px), chưa
  mở menu/tìm kiếm → hàng điều hướng trong suốt, chữ trắng; cuộn xuống → nền
  `brand-900/85` + blur. (Lượt này chỉ Trang chủ; **lượt 2 đã mở rộng ra mọi trang**
  nhờ `PageHero` — xem "Đợt VinUni lượt 2".) Link menu có gạch chân đỏ chạy ra khi hover/active; ☰ mobile biến
  thành ✕. **Hợp đồng chiều cao**: hàng điều hướng cao đúng **72px**, thanh
  thông báo ~33px — `HeroBanner` kéo `<section>` lên `-mt-[72px]` để ảnh nằm
  dưới header. Margin âm phải đặt trên CHÍNH `<section>` (có `overflow-hidden`)
  — đặt ở div con thì phần kéo lên bị cắt, dưới header lộ nền sáng + chữ trắng
  vô hình (đã gặp thật trên mobile). Đổi chiều cao header thì sửa cả 2 chỗ.
- **Hero**: tiêu đề hiện **từng từ** (`.hero-word`; dấu cách phải nằm NGOÀI
  span `inline-block`, để trong thì cuối dòng bị nuốt → các từ dính nhau);
  `aria-label` giữ nguyên câu. Desktop dùng `min-h` (không cố định `h`) — tiêu
  đề CMS dài xuống 3 dòng từng làm chữ/nút tràn đè chú thích banner ở màn hình
  cao ~800px.
- **"Câu chuyện thành công"** (`TestimonialSlider.tsx`, thay lưới đánh giá cũ)
  — kiểu khối lãnh đạo VinUni: dải xanh tràn ngang, ảnh vòm nổi trên mép dải,
  tên in hoa + trích dẫn lớn, nút ‹ ›, tự chuyển 8s (dừng khi rê chuột/focus/
  giảm chuyển động). Chưa có ảnh → chữ cái đầu tên.
- **Đối tác có logo + link** — admin `doi-tac` thêm `ImagePicker` logo (tick
  "Gỡ logo hiện tại") + ô Website (chỉ nhận `http(s)://`, khác thì lưu `null`).
  Dải chạy ngang: có logo → logo xám, rê chuột hiện màu; không → tên chữ; có
  website → `<a target=_blank>`. Chỉ lượt đầu danh sách gốc được trình đọc màn
  hình đọc/focus (`i >= partners.length` là bản lặp → `aria-hidden`, `tabIndex
  -1`, ẩn khi giảm chuyển động).
- **Tin tức kiểu tạp chí VinUni** — tin nổi bật thành ảnh phủ kín + chữ trắng
  trên lớp tối; nhãn chuyên mục **đỏ in hoa** tách khỏi ngày (Trang chủ +
  `/tin-tuc`).
- **Nút lên đầu trang** (`BackToTop.tsx`, trong `(site)/layout.tsx`) — hiện sau
  600px, vòng đỏ tô theo % đã đọc (cập nhật DOM qua ref, không setState mỗi
  khung hình), đặt ngang hàng bên trái nút liên hệ nhanh (mobile + desktop).
- **Hiệu ứng thuần CSS** (`globals.css` mục "Đợt tham khảo VinUni"):
  `.scroll-progress` (thanh đỏ dưới header theo % trang, `animation-timeline:
  scroll(root)`), `.img-reveal` (ảnh thẻ tin/sự kiện/giảng viên/thư viện "mở
  màn" + thu nhỏ theo cuộn, `view()`), `.hero-caption`, `.testimonial-*`. Hai
  hiệu ứng theo cuộn nằm trong `@supports (animation-timeline: …)` — Firefox/
  Safari cũ: thanh ẩn, ảnh hiện bình thường. `.img-reveal` chỉ animate
  `clip-path` + `scale` (không đụng `transform`/`opacity` của Reveal/TiltCard).
  **Bài học**: `view()` bám vùng cuộn gần nhất — khung cha `overflow-hidden` LÀ
  vùng cuộn (không cuộn được) → hiệu ứng không chạy. Khung cha cần bo góc thì
  dùng **`overflow-clip`** (đã đổi ở các thẻ liên quan). Tất cả tắt khi
  `prefers-reduced-motion`.
- Đã thử trọn vòng đối tác tạm `audit-tmp-doitac` (logo từ thư viện + website)
  → Trang chủ hiện logo + link tab mới → đã xoá, DB dev như cũ.
- **Chưa làm**: chưa chạy `npm run build`; hiệu ứng theo cuộn chỉ xác nhận trên
  Chromium dev (giá trị `clip-path`/`scale` đổi đúng theo vị trí cuộn), chưa
  thử Safari/điện thoại thật.

### Đợt VinUni lượt 2 (02/10/2026) — thứ tự Trang chủ, trang con, hiệu ứng
Người dùng: "chưa khai thác hết hiệu ứng của VinUni, xem các trang khác và cân
nhắc lại thứ tự khối Trang chủ". Đã duyệt 6 trang VinUni (Trang chủ, Về VinUni,
Viện Khoa học Sức khỏe, Tin tức, Đời sống SV, Tuyển sinh) — VinUni dùng WOW.js
(fadeInUp từng phần tử), Slick, Fancybox; Trang chủ chỉ 7 khối ~5.200px, Tin tức ở
vị trí thứ 3. Người dùng chọn qua `AskUserQuestion` **tất cả** hạng mục:

- **Trang chủ 10 khối** (`(site)/page.tsx`, desktop ~11.900 → ~7.850px): Banner +
  Công cụ nhanh → Vì sao chọn (3D) → **Tin tức · Thông báo · Sự kiện** (gộp 3 khối
  cũ, cột phải 380px: Thông báo + Sự kiện sắp diễn ra) → Ngành đào tạo (slider) →
  Sứ mệnh/Tầm nhìn → Giảng viên → Câu chuyện thành công → **Trải nghiệm Hợp Lực**
  (bento thư viện + lightbox + nút "Xem video" nếu có mục video) → Đối tác (logo,
  dời xuống gần cuối như VinUni) → **Tuyển sinh** (gộp "4 bước" + CTA + link Công
  khai). Khối "Sự kiện" và "4 bước" riêng đã bỏ. Mobile: 2 tin nhỏ thành hàng ngang
  gọn (ảnh 112px trái) thay thẻ cao. **Lỗi đã gặp**: dòng giờ/địa điểm sự kiện
  `truncate` (nowrap) đẩy cột 380px rộng thành 428px → cả trang tràn ngang ~30px —
  cột dùng `min-w-0 grid-cols-[minmax(0,1fr)]`.
- **`PageHero`** (`src/components/site/PageHero.tsx`, async server component) —
  banner ảnh + breadcrumb "Trang chủ › …" + tiêu đề cho **toàn bộ 21 trang con**
  (kể cả `(site)/not-found.tsx`, `PageStub`). Ảnh: ảnh bìa riêng của trang (trang
  tĩnh/bài viết/sự kiện) → `site_settings.pageBannerUrl` (lúc đầu ở admin/cai-dat, nay
  ở admin/banner-trang-con — xem "Banner riêng từng trang con") → nền gradient xanh + lưới. Tiêu đề/mô tả cũ trong thân trang đã dời lên banner;
  chi tiết ngành/sự kiện có thêm cột thông tin dính bên phải; chi tiết giảng viên
  ảnh khung vòm. **Header giờ trong suốt ở MỌI trang** (`SiteHeader.tsx` bỏ hẳn
  nhánh giao diện sáng) — xem quy ước #12.
- **Tin tức dạng tổng hợp** (`/tin-tuc`): thanh tab chuyên mục (cuộn ngang trên
  mobile) → trang 1: tin nổi bật ảnh lớn + cột "Mới nhất" (5 bài) → lưới phần còn
  lại → phân trang (giữ `?category=`/`?page=`). Tiêu đề trang lấy theo tên chuyên mục.
- **Giới thiệu nhiều khối** (`/gioi-thieu`): mục lục dính bên trái + nội dung trang
  tĩnh → Sứ mệnh/Tầm nhìn + 4 con số (lấy lại từ Nội dung Trang chủ, không nhập 2
  lần) → **Cột mốc** (`MilestoneTimeline.tsx`: thanh năm, mặc định năm mới nhất,
  ← → / Home / End, mẫu tablist). Admin **`admin/cot-moc`** (khối "Trang tĩnh" trong
  sidebar, cùng quyền `pages` — entity `pages` giờ có `children`). Data layer
  `getMilestoneYears()` ẩn mốc có tiêu đề placeholder. **Seed không tạo mốc nào**
  (không bịa lịch sử trường); `demo:load` tạo 6 "Mốc mẫu" ghi rõ là minh hoạ.
- **FAQ cuối `/tuyen-sinh`** — 6 câu đầu từ `faqs`, dùng chung `FaqList.tsx` với `/faq`.
- **Hiệu ứng mới**:
  - `.img-shine` (globals.css) — rê chuột vào thẻ: vệt sáng quét chéo 1 lượt + phủ
    xanh nhẹ (VinUni `.imgGroup`). **Không đặt `position` trong class này** (CSS
    tự viết đứng SAU lớp utilities → sẽ đè `absolute` của Tailwind); phần tử phải tự
    có `relative`/`absolute`.
  - `MoreLink` (`src/components/ui/MoreLink.tsx`) thay nút viên thuốc `PillLink`:
    chữ in hoa + tam giác đỏ + gạch chân đỏ chạy ra (`.link-underline`).
  - `SectionHeading` giờ tự hiện so le nhãn → tiêu đề → mô tả (mỗi phần 1 `Reveal`);
    các khối Trang chủ bỏ `Reveal` bọc cả khối, chuyển sang từng phần tử.
  - `EdgeSlider.tsx` — slider "tràn mép" (thẻ đầu thẳng lề 1320px, thẻ cuối lộ ra
    mép phải), cuộn gốc + scroll-snap, nút ‹ ›, kéo chuột (chặn click sau khi kéo),
    thanh tiến trình. Dùng cho Ngành đào tạo (hiện TẤT CẢ ngành, không chỉ 6 ngành
    nổi bật). `ProgramCard` thành flex-col để dòng cuối nằm sát đáy thẻ cao.
  - `Lightbox.tsx` (`LightboxGroup` + `LightboxTrigger`, `<dialog>` + `showModal()`)
    — ảnh phóng to, YouTube phát tại chỗ qua **youtube-nocookie.com** (CSP
    `frame-src` đã mở riêng domain này), link video khác → nút mở tab mới; ← →,
    vuốt, Esc. `youtubeId()` trong utils (+ test). `GalleryMedia` giờ chỉ hiển thị.
    **2 lỗi thật đã sửa**: (1) dọn dẹp effect gọi `dialog.close()` → StrictMode dev
    chạy dọn dẹp ngay sau mount → sự kiện `close` đóng hộp vừa mở; (2) đóng bằng Esc
    gốc của trình duyệt dựa vào sự kiện `close` bất đồng bộ — có môi trường không bắn
    kịp → hộp ẩn nhưng trang vẫn khoá cuộn. Giờ tự bắt Esc/`cancel` và đóng qua state.
- `getSiteSettings()` bọc `cache()` của React (layout + trang + PageHero gọi chung).
- `demo:load` khi đã nạp từ trước giờ **bổ sung phần mới** (`loadExtras()`: 6 mốc
  mẫu + `pageBannerUrl` = ảnh demo phòng mô phỏng) thay vì từ chối; `demo:clean` gỡ
  cả 2 (và gỡ `pageBannerUrl` nếu admin tự chọn ảnh demo).
- Đã test trình duyệt (desktop 1280 + mobile 375): 21 trang con trả 200 + có banner,
  404 đúng, không tràn ngang, không lỗi console; trọn vòng admin Cột mốc (thêm → hiện
  ở /gioi-thieu → xoá). **Đổi `next.config.js` (CSP) cần khởi động lại `npm run dev`**
  — chưa thử phát video YouTube thật vì dữ liệu demo không có mục video.

### Chữ chạy lên khi cuộn tới (kiểu VinUni) — viết lại `Reveal` (02/10/2026)
Người dùng: "thiếu hiệu ứng đi đến đâu chữ mới chạy lên đến đấy". Đối chiếu VinUni:
WOW.js (`offset: 0`) + animate.css `fadeInUp` — phần tử ẩn sẵn, mép trên chạm khung
nhìn thì chạy lên (translate 100% chiều cao) + rõ dần trong 1s, mỗi phần tử 1 lần.

- **Lỗi của bản cũ** (`Reveal` bám % vị trí cuộn): hẹn giờ dự phòng 2s cho hiện
  **TẤT CẢ** phần tử kể cả phần chưa cuộn tới → cuộn chậm hơn 2s là mọi thứ đã hiện
  sẵn, gần như không thấy hiệu ứng; dừng tay giữa chừng thì chữ dừng lửng lơ.
- **`Reveal.tsx` mới**: IntersectionObserver (`rootMargin` lùi mép dưới 6%) bật class
  `reveal-in` 1 lần; CSS `.reveal`/`.reveal-in` (globals.css) chạy opacity 0.9s +
  transform 1s, quãng trượt `min(100%, 64px)`. `delay` giờ là **ms thật**
  (`transition-delay`, như `data-wow-delay`). Dự phòng 1,5s chỉ hiện phần tử **đã
  nằm trong khung nhìn**. Phần tử nằm trong dải cuộn ngang (slider ngành, thẻ vuốt
  mobile) theo dõi CHÍNH dải đó (`horizontalScroller()`), nếu không thẻ khuất bên
  phải sẽ trống trơn khi lướt tới. Đã kiểm chứng: sau 3s cả 58 phần tử dưới màn
  hình Trang chủ vẫn ẩn, cuộn tới mới chạy lên (chụp được lúc ô thư viện đang lên).
- **`MarkdownContent`** bọc từng khối cấp 1 (đoạn, tiêu đề, danh sách, trích dẫn)
  trong `Reveal` → bài viết/Giới thiệu/chi tiết ngành chạy lên từng đoạn. Khoảng
  cách (`mb-*`, `first:mt-0`, `last:mb-0`) dời sang LỚP BỌC (bên trong lớp bọc phần
  tử nào cũng là first/last child). Prop `reveal={false}` cho đoạn trích có
  line-clamp (thẻ sự kiện) và bản xem trước trong `MarkdownEditor`.
- CSS `.reveal` đứng sau lớp utilities → phần tử bọc `Reveal` không được mang class
  `transform`/`transition`/`opacity` của Tailwind (bị đè). `@media print` hiện hết;
  `prefers-reduced-motion` hiện ngay không chuyển động.

### Ảnh cho ngành đào tạo (03/10/2026)
Người dùng: "các ngành đào tạo nên có ảnh tự set được cho sinh động".
- Cột `programs.image_url` + admin `nganh-dao-tao`: `ImagePicker` (tải lên / chọn từ
  thư viện, tick "Gỡ ảnh"), danh sách có ảnh thu nhỏ; sửa ngành không đụng ô ảnh thì
  giữ ảnh cũ (`resolveImageUrl`). Dashboard thêm nhắc việc "X ngành chưa có ảnh".
- `ProgramCard` (slider Trang chủ): có ảnh → ảnh tràn mép trên thẻ (168px) + nhãn kính
  mã ngành/thời gian, thân thẻ vẫn khối màu `programGradient`; không ảnh → như cũ.
  Slider đổi chiều cao cố định → `min-h-*` (các thẻ tự bằng nhau theo thẻ cao nhất).
- `ProgramExplorer` (`/nganh-dao-tao`): đầu thẻ là ảnh, hoặc khối màu + mã ngành chữ mờ
  khi chưa có ảnh (màu theo thứ tự gốc, không đổi khi lọc). Trang chi tiết: banner
  `PageHero` dùng ảnh ngành (không có → ảnh banner mặc định) **và** hiện ảnh rõ nét
  (không phủ màu) ở đầu nội dung (16:9, nhãn mã ngành) + đầu khung "Xét tuyển ngành"
  dính bên phải — người dùng yêu cầu thêm vì ảnh nền banner bị lớp tối che khó thấy.
- `demo:load` gắn 6 ảnh demo cho 6 ngành (trả lại khi `demo:clean`).
- Sửa kèm (lỗi bố cục admin có từ trước, lộ rõ với Montserrat): mọi khung "danh sách +
  form" `lg:grid-cols-[1fr_…]` → **`minmax(0,1fr)`** (tiêu đề dài `truncate` từng kéo
  giãn cột, đẩy form ra ngoài ở 1024–1280px); ô chọn file `ImagePicker` `max-w-full`;
  hàng bài viết `flex-wrap` dưới `sm`; ô nhập ở `danh-hieu` `min-w-0`. Đã quét 25 trang
  admin × 3 khổ (360/1024/1280) không còn tràn ngang. **Khung admin mới dạng danh sách
  + form: luôn dùng `minmax(0,1fr)`, không dùng `1fr` trần.**

### Banner riêng từng trang con (03/10/2026)
Người dùng: "cần mỗi trang có thể tự đổi banner từng trang con".
- Bảng **`page_banners`** (`key` = mã trong **`PAGE_BANNER_SLOTS`**, `src/lib/constants.ts`
  — 12 trang chức năng: Ngành đào tạo, Tuyển sinh, Tra cứu, Tin tức, Sự kiện, Giảng
  viên, Thư viện, FAQ, Công khai, LMS, Tìm kiếm, 404). Data layer
  `src/lib/data/page-banners.ts` (`getPageBannerMap()` bọc `cache()` — 1 query/request).
- **`PageHero` nhận `bannerKey`**; thứ tự ảnh: `imageUrl` (ảnh riêng của bài viết / sự
  kiện / ngành / trang tĩnh) → banner của `bannerKey` → `site_settings.page_banner_url`
  (mặc định) → nền gradient. Trang chi tiết dùng key của mục cha (bài không có ảnh bìa
  → banner "Tin tức"; trang giảng viên → "Đội ngũ giảng viên"; trang công khai chưa có
  ảnh bìa → "Công khai").
- **Admin `admin/banner-trang-con`** (khối Giao diện, module quyền mới `page-banners` —
  tài khoản đã có danh sách quyền cụ thể phải được cấp thêm ở admin/nguoi-dung): 1 thẻ
  = 1 form (xem trước ảnh đang dùng + nhãn "Ảnh riêng"/"Đang dùng ảnh mặc định", tải /
  chọn ảnh, "Gỡ ảnh riêng", "Xem trang ↗"); lưu xong ở lại trang, thẻ vừa lưu tô viền.
  Gồm: ảnh mặc định (chuyển từ admin/cai-dat về đây — Cài đặt chung giờ chỉ còn link
  sang), 12 trang chức năng, và các **trang tĩnh có route** (`staticPageHref()` trong
  utils — sửa thẳng `pages.cover_image_url`, cùng field với admin/trang-tinh, không lưu
  trùng). `demo:clean` gỡ banner/ảnh bìa trỏ ảnh demo.
- **Lỗi thật phát hiện khi test, đã sửa — tải ảnh > 1MB trong MỌI form admin đều lỗi
  âm thầm**: Next mặc định chỉ nhận body Server Action 1MB (và 10MB qua `proxy.ts`), dù
  `media.ts` cho phép ảnh 10MB / tài liệu 20MB / video 50MB. `next.config.js` thêm
  `experimental.serverActions.bodySizeLimit` + `experimental.proxyClientMaxBodySize`
  = `"55mb"`. Đã kiểm chứng bằng bản production (`next build` + `next start`): ảnh
  2,24MB tải lên được. **Cần khởi động lại `npm run dev` để áp dụng.**
- **Thêm trang con mới**: thêm 1 dòng vào `PAGE_BANNER_SLOTS` + truyền `bannerKey` cho
  `<PageHero>` của trang đó (quy ước #12).

---

## 6. Quy ước code đã thiết lập — PHẢI tuân theo khi thêm trang mới

1. **Trang/component công khai không gọi `db` hay đọc dữ liệu tĩnh trực tiếp** — luôn qua `src/lib/data/*.ts` (VD: `getPrograms()`, `getSiteSettings()`, `getHomepageContent()`). Riêng trang **admin** được gọi `db` trực tiếp (xem pattern `admin/bai-viet`) vì admin luôn gắn chặt với DB, không cần lớp trung gian.
2. **Điều hướng active tự nhận diện qua `usePathname()`** (xem `SiteHeader.tsx`, `AdminSidebar.tsx`) — không truyền prop `activePage` thủ công.
3. **Mọi trang admin cần đăng nhập tự động được bảo vệ** nếu nằm trong `admin/(dashboard)/` — không cần tự check session trong từng page, `proxy.ts` đã lo phần đó.
4. **Server Actions ưu tiên hơn API route** cho các thao tác CRUD trong admin (đã dùng pattern `<form action={async () => { "use server"; ... }}>`). API route (`app/api/*`) chỉ dùng cho endpoint được gọi từ bên ngoài (VD: form công khai `/api/admissions`).
5. **Mọi component/màu mới dùng token trong `tailwind.config.ts`**, không hard-code mã hex mới trừ khi thật sự cần (và phải thêm token mới, không viết tay).
6. **File tạm/test (screenshot .png, db test data) không commit vào git** — dọn trước khi đóng gói/commit.
7. **Sửa/xoá bảng đơn dòng** (`site_settings`, `homepage_content`): luôn query/update theo `id = "main"` cố định — không tạo dòng thứ 2, không xoá dòng này (form admin chỉ có Sửa, không có Thêm/Xoá cho 2 bảng này).
8. **Form Thêm/Sửa dùng chung 1 route** (xem `admin/nganh-dao-tao`, `admin/trang-tinh`): sửa qua query param `?edit={id}` ở server component, prefill `defaultValue`, không dùng client state. Đặt `key={editing?.id ?? "new"}` trên `<form>` để React remount form khi đổi giữa Thêm/Sửa (tránh giữ nhầm giá trị cũ). **Cuối `upsertXxxAction` (sau mọi `revalidatePath`), luôn gọi `redirect(basePath)`** (import từ `next/navigation`) để về danh sách sạch + form "Thêm mới" trống sau khi Lưu — trừ trang cấu hình 1 dòng (`cai-dat`, `trang-chu`) thì không áp dụng (xem mục 5 "Rà soát thao tác admin").
9. **Upload ảnh trong admin**: luôn dùng `saveUploadedFile`/`saveUploadedFileIfPresent` (`src/lib/media.ts`) — không tự viết lại logic ghi file. Field file trong form đặt `name` riêng (VD `photo`, `avatar`, `coverImage`, `heroImage`) để phân biệt khi 1 trang có nhiều input file.
10. **Danh sách có thứ tự hiển thị** (`partners`, `gallery_items`, `faculty`, `testimonials`): dùng cột `sortOrder` nhập tay, sort bằng `asc(schema.<table>.sortOrder)` ở data layer — không thêm thư viện kéo-thả.
11. **Trang admin mới cần phân quyền**: thêm entity vào `ADMIN_NAV`
    (`src/lib/constants.ts`, tự trở thành 1 module chọn được ở
    `admin/nguoi-dung`), rồi gọi `await requirePermission("<key>")` ở dòng
    đầu tiên trong thân **cả `page.tsx` lẫn mọi hàm trong `actions.ts`**
    tương ứng (2 lớp — chặn cả lúc render trang lẫn lúc gọi thẳng Server
    Action) — xem mục 5 "Phân quyền admin theo module".
12. **Trang công khai mới trong `(site)` (trừ Trang chủ) BẮT BUỘC mở đầu bằng
    `<PageHero crumbs=… title=…>`** (`src/components/site/PageHero.tsx`) rồi mới
    tới nội dung bọc trong `<DecorativeSection>` — header chữ trắng trong suốt ở
    mọi trang, thiếu khối nền tối đầu trang thì logo/menu vô hình trên nền sáng.
    Không tự viết `<section className="px-6 py-20 sm:px-8">` trần (xem mục 5 "Đợt
    VinUni lượt 2" và "Mở rộng hiệu ứng + trang trí ra toàn bộ trang con").
    Link "Xem tất cả" đầu khối dùng `<MoreLink>`; ảnh trong thẻ thêm `img-shine`.
    Trang mới cần banner đổi được trong admin: thêm vào `PAGE_BANNER_SLOTS` + truyền
    `bannerKey` cho `PageHero` (xem mục 5 "Banner riêng từng trang con").
13. **Thẻ nội dung mới ở web công khai muốn có chiều sâu 3D**: bọc trong
    `<TiltCard>` thay vì tự viết `hover:-translate-y-*` (2 transform sẽ đè
    nhau). Ghi chú nội bộ dạng `[Trường điền: …]` không được lộ ra web công
    khai — lọc ở data layer bằng `hasPlaceholder()` (`src/lib/utils.ts`).
    Hiển thị `created_at` SQLite luôn qua `formatDbDateTime()`. Ảnh trong thẻ
    muốn "mở màn" theo cuộn: thêm class `img-reveal` cho khung ảnh, và mọi khung
    cha bo góc dùng `overflow-clip` thay `overflow-hidden` (xem mục 5 "Đợt tham
    khảo VinUni").
14. **Trang admin mới có danh sách lớn cần đưa ra Excel**: route handler
    `xuat-csv/route.ts` cạnh `page.tsx`, gọi `requirePermission`, dùng
    `toCsv`/`digitsCell` (`src/lib/csv.ts`), lọc chung 1 hàm với trang.

---

## 7. Việc cần làm tiếp theo (theo thứ tự ưu tiên gợi ý)

1. ~~Hoàn thiện các trang công khai còn là `PageStub`~~ — **XONG TOÀN BỘ** (kể cả `/nganh-dao-tao` — từng bị sót, vá ở lượt rà soát lần 2, xem mục 5).
2. ~~Trang quản trị Media/Trang tĩnh/Danh mục bài viết/Đối tác/Giảng viên/Đánh giá cựu SV/Thư viện ảnh Trang chủ/Menu chính~~ — **XONG**.
3. ~~Đợt "hiệu ứng"~~ — **XONG 4/4 hạng mục đã chốt** (xem mục 5 "Đợt 'hiệu ứng' Trang chủ"). Còn có thể cân nhắc thêm sau nếu người dùng muốn: hover tinh tế hơn ở card, transition mượt khi chuyển trang (View Transitions API) — **hỏi lại phạm vi cụ thể trước khi làm thêm**, đừng tự suy đoán.
4. ~~Rà soát bảo mật/SEO trước khi public + Phân quyền admin~~ — **XONG** (xem mục 5 "Rà soát trước khi đưa web lên mạng thật" + "Phân quyền admin theo module").
5. ~~Rà soát lần 2 (admin + web công khai)~~ — **XONG** (xem mục 5 "Rà soát admin + web công khai lần 2") — vá 8 vấn đề.
6. ~~Nhóm nâng cấp nhỏ đã hoãn~~ — **XONG** (xem mục 5 "Nội dung demo + nhóm nâng cấp nhỏ đã hoãn"): 404/error page tuỳ chỉnh, CSP thật (đã test kỹ), hạ tầng gửi email qua Resend + "Quên mật khẩu" cho admin, Google Analytics (code sẵn, chờ người dùng điền Measurement ID), nội dung demo cho 6 ngành đào tạo.
7. **Còn lại, cần người dùng tự làm** (không phải việc kỹ thuật): ảnh thật cho các mục đang trống (`gallery_items`/`heroImageUrl`/`photoUrl`/`avatarUrl` — đã thử tự lấy demo từ Wikimedia Commons nhưng không dùng được, xem mục 5 lý do), số liệu "3 công khai" thật (4 trang `admin/trang-tinh` slug `cong-khai-*`, xác nhận với trường có bắt buộc theo Thông tư 36/2017 không), cấu hình `lmsUrl` (`admin/cai-dat`), tạo tài khoản Resend/Google Analytics rồi điền key/Measurement ID vào `.env` (xem mục 9).
8. **Chuyển DB sang PostgreSQL** theo mục 4.4 (lưu ý: `public/uploads/` cũng cần chuyển sang S3 cùng lúc — xem mục 4.1c) — hạng mục kiến trúc lớn nhất còn lại, tạm dừng để làm 2 đợt rà soát + nhóm nâng cấp nhỏ ở trên, giờ có thể quay lại làm tiếp. **Đây là ưu tiên cao nhất còn lại** trước khi đưa web lên mạng cho người dùng thật.
9. Giai đoạn 2 (xa hơn): thiết kế lại UI cho Quản lý đào tạo/Điểm số/Học phí/LMS riêng — SRS gốc có đặc tả chi tiết, nhưng nên viết SRS riêng cập nhật khi bắt đầu (SRS gốc đã hơi cũ so với quyết định thực tế đã đổi dọc đường).

---

## 8. Vấn đề còn bỏ ngỏ — cần người dùng quyết định khi tới lúc

- ~~Lưu trữ media~~ — **đã quyết định**: local filesystem (`public/uploads/`) cho giai đoạn dev/SQLite hiện tại, chuyển sang S3 khi lên production cùng lúc chuyển PostgreSQL (xem mục 4.1c, 4.4).
- **Liên kết LMS VNPT**: chỉ là link đơn giản hay cần SSO/API thật? (SRS ghi "tuỳ chọn SSO nếu VNPT hỗ trợ" — chưa xác nhận VNPT có hỗ trợ không)
- **Domain/hosting thật**: chưa chọn nền tảng deploy (Vercel? VPS? AWS?) — ảnh hưởng cách cấu hình env, DB connection. Còn ảnh hưởng thêm 2 chỗ (xem mục 5 "Đánh giá rủi ro traffic lớn/spam"): rate limit đang lưu bộ nhớ tiến trình (`Map`) nên chỉ chính xác khi deploy **1 instance/1 process** — chọn VPS chạy 1 tiến trình thì không sao, chọn serverless nhiều instance hoặc PM2 cluster nhiều worker thì giới hạn thực tế lỏng hơn khai báo (muốn chính xác tuyệt đối phải chuyển sang lưu ở Redis dùng chung); và `public/uploads/` bắt buộc phải deploy nơi có filesystem persistent (VPS/server dài hạn) — serverless (Vercel) sẽ làm mất ảnh/video admin upload.

---

## 9. Thông tin vận hành

### Lệnh chạy dự án
```bash
npm install
npm run db:migrate   # tạo bảng (an toàn chạy lại nhiều lần)
npm run db:seed      # tạo dữ liệu mẫu (an toàn chạy lại nhiều lần)
npm run dev
```

### Tài khoản admin demo (đã seed sẵn — đổi trước khi lên production)
```
Email:    admin@hopluc.edu.vn
Mật khẩu: HopLuc@2026
```
Tài khoản này giữ `permissions = NULL` (toàn quyền, xem mục 5 "Phân quyền
admin theo module") — tạo thêm tài khoản khác qua `admin/nguoi-dung` khi
có nhiều người cùng vào quản trị, mỗi tài khoản tự chọn được truy cập
module nào.

### Trước khi deploy production — đừng quên
- Đổi `SESSION_SECRET` sang chuỗi ngẫu nhiên thật (`getSecret()` ở
  `src/lib/auth.ts` sẽ tự throw lỗi nếu quên, chặn chạy production với
  giá trị mẫu).
- Set `NEXT_PUBLIC_SITE_URL` thành domain thật (dùng cho sitemap/robots/Open
  Graph — xem `.env.example`).
- Đổi mật khẩu tài khoản admin demo ở trên (hoặc tạo tài khoản mới qua
  `admin/nguoi-dung` rồi xoá tài khoản demo).
- Set `RESEND_API_KEY` (+ xác minh domain trên Resend rồi đổi
  `RESEND_FROM_EMAIL`) nếu muốn email báo hồ sơ/tin nhắn mới và "Quên mật
  khẩu" hoạt động thật — để trống vẫn chạy được, chỉ là không gửi email.

### Hướng dẫn tạo tài khoản Google Analytics (để lấy Measurement ID)
Việc này cần tài khoản Google của bạn — không tự làm thay được. Các bước:
1. Vào https://analytics.google.com, đăng nhập bằng tài khoản Google.
2. Bấm "Bắt đầu đo lường" (Start measuring) → đặt tên tài khoản (VD "Hợp
   Lực"), bỏ qua các mục chia sẻ dữ liệu nếu không cần.
3. Tạo "Thuộc tính" (Property) → đặt tên (VD "Website Hợp Lực"), chọn múi
   giờ "Việt Nam (GMT+7)", đơn vị tiền tệ VND.
4. Ở bước "Luồng dữ liệu" (Data stream) → chọn "Web" → điền URL website
   thật (VD `https://hopluc.edu.vn`) → đặt tên luồng.
5. Sau khi tạo xong, Google hiện "Mã đo lường" (Measurement ID) dạng
   `G-XXXXXXXXXX` — copy mã này.
6. Dán vào biến `NEXT_PUBLIC_GA_MEASUREMENT_ID` trong `.env`, khởi động lại
   `npm run dev`/deploy lại — site tự gắn Google Analytics, không cần sửa
   code gì thêm (xem `src/components/GoogleAnalytics.tsx`).

Có dữ liệu truy cập thường mất vài giờ mới hiện trong Google Analytics
sau khi gắn mã lần đầu — đừng lo nếu bấm vào xem ngay chưa thấy số liệu.

### Hướng dẫn tạo tài khoản Cloudflare Turnstile (chống spam form)
1. Vào https://dash.cloudflare.com, đăng ký/đăng nhập tài khoản Cloudflare
   (miễn phí, không cần có domain quản lý trên Cloudflare).
2. Vào mục **Turnstile** ở menu trái → **Add site**.
3. Đặt tên site (VD "Hợp Lực") → điền domain thật (VD `cdyduochopluc.edu.vn`)
   — chưa deploy lên domain đó cũng điền được, không bắt buộc phải trỏ đúng
   ngay lúc tạo.
4. Chọn chế độ **Managed** (mặc định, cân bằng tốt giữa bảo mật và trải
   nghiệm — không cần đổi sang Invisible/Non-interactive).
5. Sau khi tạo xong, Cloudflare hiện 2 mã: **Site Key** (public) và
   **Secret Key** (bí mật, không chia sẻ).
6. Dán vào `.env`:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAAA..."
   TURNSTILE_SECRET_KEY="0x4AAAAAAA..."
   ```
7. Khởi động lại `npm run dev`/deploy lại — 3 form (Tuyển sinh, Liên hệ,
   Đăng ký nhận tin) tự hiện thêm ô xác minh "không phải bot", không cần
   sửa code gì thêm.

### Dữ liệu demo để xem trực quan (chỉ DB dev)
```bash
npm run demo:load    # tải 15 ảnh Unsplash miễn phí (~3,6MB) + nạp bài viết, sự kiện, thư viện, ảnh giảng viên, học phí, mốc tuyển sinh, ~22 hồ sơ, tin nhắn
npm run demo:clean   # xoá đúng dữ liệu demo + trả giá trị gốc các bản ghi có sẵn đã bị sửa
```
`src/lib/db/demo-data.ts` ghi lại mọi thay đổi vào `drizzle/demo-manifest.local.json`
(không commit). Ảnh demo có đường dẫn `/uploads/demo-*`; banner/bài viết/sự
kiện/thư viện tạo TAY qua admin bằng ảnh demo, và tệp tải lên có tên `demo-*`
(lưu thành `<timestamp>-demo-*`), cũng được `demo:clean` nhận ra và xoá theo.
Đợt 02/10/2026: đã nạp demo + tạo thật qua admin 3 banner và 1 bài viết có ảnh
+ PDF đính kèm (đang còn trong DB dev, người dùng chọn "giữ lại + có lệnh
xoá"). **Ảnh chân dung giảng viên demo là người mẫu ảnh Unsplash, không phải
giảng viên thật — tuyệt đối không để lên môi trường công khai**; chạy
`demo:clean` trước khi nhập dữ liệu thật/deploy.

### Các lệnh khác
```bash
npm run build       # build production
npm run lint         # eslint . (Next 16 đã bỏ "next lint")
npm run db:studio    # xem/sửa DB trực quan qua trình duyệt
npm run db:generate  # sinh migration mới sau khi sửa schema.ts
```

### Lưu ý môi trường phát triển đặc biệt
Trong lúc code, môi trường sandbox dùng để build/test **chặn domain
`fonts.googleapis.com`**, nên nhiều lần phải tạm thay `next/font/google`
bằng font hệ thống để build kiểm tra, rồi khôi phục lại. Đây **không phải
vấn đề trên máy thật của người dùng** (có mạng đầy đủ) — chỉ nêu ra để hiểu
vì sao trong lịch sử có vài lần "khôi phục layout.tsx" lặp đi lặp lại.

Tương tự, `npm run build` (Turbopack) trong sandbox có thể báo lỗi
`failed to create junction point ... Access is denied (os error 5)` khi tạo
`.next/node_modules/...` — do sandbox không có quyền tạo junction point trên
Windows, **không phải lỗi code**. Next 16 chưa có cờ tắt Turbopack để build
bằng webpack thay thế. Khi gặp lỗi này trong sandbox, dùng `npx tsc --noEmit`
+ `npm run lint` để xác nhận thay vì `npm run build`.

**Lỗi này cũng xảy ra với `npm run dev`** nếu Claude tự khởi động server đó
từ bên trong sandbox (cùng nguyên nhân junction point) — nhưng nếu **người
dùng tự chạy `npm run dev` từ terminal thật của họ** (ngoài sandbox), server
chạy bình thường và Claude có thể gắn trình duyệt vào (`preview_start` với
`url`, không phải `name`) để test qua UI thật. Vì vậy khi cần verify UI mà
gặp lỗi junction point, nhờ người dùng tự chạy `npm run dev` thay vì Claude
tự chạy. Trên máy thật của người dùng (ngoài sandbox hoàn toàn), cả
`npm run build` lẫn `npm run dev` đều chạy bình thường không cần thao tác gì
thêm.

## 10. Cập nhật chức năng và giao diện tháng 10/2026

- Codex điều phối và tích hợp; Claude triển khai bộ kiểm tra đầu vào cho bốn API công khai, test helper, rồi review chéo chỉ đọc qua CLI.
- Dashboard dùng requireAdmin() và chỉ query/hiện KPI, bản nháp, liên kết thuộc module được cấp quyền. Layout chặn tài khoản đã bị xoá; parser quyền từ chối JSON sai cấu trúc.
- Session và token reset có phiên bản mật khẩu SHA-256 từ hash bcrypt. Đổi mật khẩu làm mất hiệu lực phiên/token cũ; reset có điều kiện cập nhật theo hash hiện tại để chống dùng lại đồng thời. Cookie cũ trước cập nhật cần đăng nhập lại. Quyền users vẫn là quyền quản trị cấp cao.
- Action dịch yêu cầu tài khoản có quyền nội dung, giới hạn payload và tần suất. API công khai trả 400/413 cho dữ liệu sai hoặc quá lớn, chuẩn hoá dữ liệu và xác nhận ngành có trong DB. Newsletter chèn bỏ qua xung đột email khi gửi đồng thời.
- Đăng ký ngành dùng slug ổn định giữa VI/EN; từ trang chi tiết tới form chọn sẵn ngành. API vẫn nhận tên Việt/Anh của client cũ và lưu tên Việt chuẩn.
- Liên hệ luôn giữ form kể cả thiếu bản ghi CMS. Liên hệ nhanh lọc href rỗng/#. Thanh admin thay ô tìm kiếm/chuông chưa có xử lý bằng liên kết xem website.
- Thẻ ngành có CSS perspective nghiêng nhẹ theo chuột; không thêm dependency 3D. Tắt trên thiết bị cảm ứng và khi chọn giảm chuyển động. Các form thêm nhãn, giới hạn nhập và thông báo lỗi/thành công cho trình đọc màn hình.
- TRUST_PROXY_HOPS mặc định 0: không tin header IP, dùng bucket chung. Khi triển khai, xác định số proxy tin cậy từ phải của XFF, proxy phải ghi/append IP thật và chặn truy cập trực tiếp vào origin. Rate limit vẫn trong bộ nhớ, cần storage dùng chung nếu chạy nhiều instance.
- Trang chi tiết ngành render theo request; bỏ generateStaticParams() để build không query DB. Build vẫn cần tải Google Fonts khi cache chưa có.
- npm test chạy test helper, API với SQLite trong bộ nhớ, quyền, token và rate limit. Không đọc/ghi DB thật hoặc gửi email. TypeScript, lint và build là các kiểm tra riêng.
- Ghi chú upload cũ ở mục 4.1c đã lỗi thời: ImagePicker và resolveImageUrl cho phép chọn ảnh từ thư viện, ưu tiên file mới, rồi ảnh được chọn, rồi ảnh cũ.
- Còn cần cho production: PostgreSQL/storage bền vững theo quyết định dự án, cấu hình email/Turnstile/proxy, duyệt nội dung và ảnh thật. Chưa xác minh hiệu ứng 3D bằng trình duyệt thật trong phiên này.
