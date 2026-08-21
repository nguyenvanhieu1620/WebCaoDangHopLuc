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
- Tiêu đề: **Fraunces** (serif, có italic accent màu đỏ cho từ nhấn mạnh)
- Nội dung: **Inter**
- Nhãn/số liệu/mono: **IBM Plex Mono** (uppercase, letter-spacing rộng)

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

### 4.1b Các bảng DB hiện tại (`src/lib/db/schema.ts`) — 13 bảng
`admin_users`, `posts` (có thêm `category_id`, `cover_image_url`), `pages`,
`media_items` (giờ dùng thật — xem 4.1c), `admission_submissions`,
`programs`, `site_settings` (đơn dòng, id `"main"`), `homepage_content`
(đơn dòng, id `"main"`, có `hero_image_url` + 2 badge nổi
`hero_badge1/2_value/label`) — nhóm bảng gốc/Giai đoạn 1a. Thêm ở đợt dựng
lại Trang chủ theo thiết kế mới: `categories` (danh mục bài viết),
`partners`, `gallery_items`, `faculty`, `testimonials` — 4 bảng sau đều có
cột `sort_order` (admin tự nhập số để sắp vị trí hiển thị, không làm
kéo-thả).

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
- Trang tĩnh (`admin/trang-tinh`) — CRUD đầy đủ cho bảng `pages` (thêm/sửa/xoá) — **đã test qua trình duyệt thật**. Chưa nối hiển thị ra `gioi-thieu`/`lien-he` (xem phần PageStub bên dưới)
- Quản lý tuyển sinh (`admin/tuyen-sinh`) — danh sách hồ sơ, đổi trạng thái (Mới/Đã xem/Đã liên hệ)
- API `/api/admissions` — nhận form đăng ký tuyển sinh từ site công khai, lưu DB thật
- Database: 13 bảng (xem mục 4.1b), đã seed dữ liệu mẫu (xem mục 9 — tài khoản test)
- Workflow migration versioned (`db:generate` + `db:migrate`) — **đã thực sự triển khai** (trước đây chỉ ghi trong tài liệu nhưng `package.json` còn thiếu, gây lỗi thật khi lỡ chạy `db:push` trên DB đã tồn tại — xem mục 4.2)

### Còn là khung tạm (`PageStub` — cần làm nội dung thật)
**Trang công khai:** Giới thiệu, Tuyển sinh (form thật — hiện tại API đã sẵn
nhưng UI form chưa nối), Tra cứu kết quả, Tin tức (danh sách + chi tiết bài
viết — cần nối với bảng `posts` đã có sẵn trong DB), Thư viện ảnh/video, LMS
(trang hướng dẫn link VNPT), Liên hệ. (Ngành đào tạo danh sách + chi tiết đã
xong, lấy dữ liệu thật từ DB.)

Giới thiệu/Liên hệ: nội dung đã có thể nhập qua `admin/trang-tinh` (bảng
`pages`), nhưng trang công khai **chưa đọc từ đó** — vẫn là `PageStub` trống.
Việc nối hiển thị để dành cho đợt làm UI các trang này.

`/thu-vien` (trang công khai) cũng chưa nối vào `gallery_items`/`media_items`
— hiện chỉ dùng nội bộ cho khối bento ở Trang chủ.

### Danh sách ngành đào tạo — quản lý qua DB, không còn mảng tĩnh
Bảng `programs` (xem mục 4.1b), quản lý qua `admin/nganh-dao-tao` —
**không giới hạn 6 ngành**, thêm bao nhiêu tuỳ ý qua CMS. Có cờ `featured`
để chọn ngành hiện ở trang chủ (không đánh dấu ngành nào thì tự lấy 6 ngành
đầu). Màu thẻ tự xoay vòng qua `programGradient(index)` trong
`constants.ts`, không cần khai báo màu thủ công.

---

## 6. Quy ước code đã thiết lập — PHẢI tuân theo khi thêm trang mới

1. **Trang/component công khai không gọi `db` hay đọc dữ liệu tĩnh trực tiếp** — luôn qua `src/lib/data/*.ts` (VD: `getPrograms()`, `getSiteSettings()`, `getHomepageContent()`). Riêng trang **admin** được gọi `db` trực tiếp (xem pattern `admin/bai-viet`) vì admin luôn gắn chặt với DB, không cần lớp trung gian.
2. **Điều hướng active tự nhận diện qua `usePathname()`** (xem `SiteHeader.tsx`, `AdminSidebar.tsx`) — không truyền prop `activePage` thủ công.
3. **Mọi trang admin cần đăng nhập tự động được bảo vệ** nếu nằm trong `admin/(dashboard)/` — không cần tự check session trong từng page, `proxy.ts` đã lo phần đó.
4. **Server Actions ưu tiên hơn API route** cho các thao tác CRUD trong admin (đã dùng pattern `<form action={async () => { "use server"; ... }}>`). API route (`app/api/*`) chỉ dùng cho endpoint được gọi từ bên ngoài (VD: form công khai `/api/admissions`).
5. **Mọi component/màu mới dùng token trong `tailwind.config.ts`**, không hard-code mã hex mới trừ khi thật sự cần (và phải thêm token mới, không viết tay).
6. **File tạm/test (screenshot .png, db test data) không commit vào git** — dọn trước khi đóng gói/commit.
7. **Sửa/xoá bảng đơn dòng** (`site_settings`, `homepage_content`): luôn query/update theo `id = "main"` cố định — không tạo dòng thứ 2, không xoá dòng này (form admin chỉ có Sửa, không có Thêm/Xoá cho 2 bảng này).
8. **Form Thêm/Sửa dùng chung 1 route** (xem `admin/nganh-dao-tao`, `admin/trang-tinh`): sửa qua query param `?edit={id}` ở server component, prefill `defaultValue`, không dùng client state. Đặt `key={editing?.id ?? "new"}` trên `<form>` để React remount form khi đổi giữa Thêm/Sửa (tránh giữ nhầm giá trị cũ).
9. **Upload ảnh trong admin**: luôn dùng `saveUploadedFile`/`saveUploadedFileIfPresent` (`src/lib/media.ts`) — không tự viết lại logic ghi file. Field file trong form đặt `name` riêng (VD `photo`, `avatar`, `coverImage`, `heroImage`) để phân biệt khi 1 trang có nhiều input file.
10. **Danh sách có thứ tự hiển thị** (`partners`, `gallery_items`, `faculty`, `testimonials`): dùng cột `sortOrder` nhập tay, sort bằng `asc(schema.<table>.sortOrder)` ở data layer — không thêm thư viện kéo-thả.

---

## 7. Việc cần làm tiếp theo (theo thứ tự ưu tiên gợi ý)

1. Hoàn thiện các trang công khai còn là `PageStub` — ưu tiên: **Tin tức** (danh sách + chi tiết — đã có sẵn bảng `posts` + `categories` với dữ liệu thật, Trang chủ đã query mẫu qua `getLatestPublishedPosts()`, chỉ cần dựng UI 2 trang này), **Tuyển sinh** (nối form thật vào API `/api/admissions` đã có sẵn), **Giới thiệu/Liên hệ** (nội dung đã nhập được qua `admin/trang-tinh`, chỉ cần trang công khai đọc bảng `pages` theo slug và hiển thị), **Thư viện** (`/thu-vien` — có thể dùng lại `gallery_items` + `media_items`). ~~Ngành đào tạo~~ đã xong.
2. Upload ảnh thật cho các mục đang seed rỗng (`gallery_items` chưa có ảnh, `heroImageUrl`/`photoUrl`/`avatarUrl` đa số null) — hiện Trang chủ tự hiện placeholder gradient, cần người dùng vào từng trang admin liên quan (`admin/trang-chu`, `admin/thu-vien-trang-chu`, `admin/giang-vien`, `admin/danh-gia`) upload ảnh thật.
3. ~~Trang quản trị Media~~ đã xong (upload thật vào `public/uploads/`). ~~Trang quản trị Trang tĩnh~~ đã xong CRUD, chỉ còn thiếu nối hiển thị (mục 1). ~~Danh mục bài viết~~, ~~Đối tác~~, ~~Giảng viên~~, ~~Đánh giá cựu SV~~, ~~Thư viện ảnh Trang chủ~~ đều đã xong.
4. Khi các trang xong hết → thực hiện chuyển DB sang PostgreSQL theo mục 4.4 (lưu ý: `public/uploads/` cũng cần chuyển sang S3 cùng lúc — xem mục 4.1c).
5. Giai đoạn 2 (xa hơn): thiết kế lại UI cho Quản lý đào tạo/Điểm số/Học phí/LMS riêng — SRS gốc có đặc tả chi tiết, nhưng nên viết SRS riêng cập nhật khi bắt đầu (SRS gốc đã hơi cũ so với quyết định thực tế đã đổi dọc đường).

---

## 8. Vấn đề còn bỏ ngỏ — cần người dùng quyết định khi tới lúc

- ~~Lưu trữ media~~ — **đã quyết định**: local filesystem (`public/uploads/`) cho giai đoạn dev/SQLite hiện tại, chuyển sang S3 khi lên production cùng lúc chuyển PostgreSQL (xem mục 4.1c, 4.4).
- **Liên kết LMS VNPT**: chỉ là link đơn giản hay cần SSO/API thật? (SRS ghi "tuỳ chọn SSO nếu VNPT hỗ trợ" — chưa xác nhận VNPT có hỗ trợ không)
- **Domain/hosting thật**: chưa chọn nền tảng deploy (Vercel? VPS? AWS?) — ảnh hưởng cách cấu hình env, DB connection.

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
