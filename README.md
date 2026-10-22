# Website Trường Cao đẳng Y Dược Hợp Lực

Base hệ thống Next.js 16 (App Router) + TypeScript + Tailwind CSS + Drizzle ORM
(PostgreSQL), xây theo đúng thiết kế đã chốt (màu thương hiệu, font Montserrat)
từ bản mockup Claude Design.

## 1. Cài đặt & chạy lần đầu

Cần cài **Docker Desktop** (chạy PostgreSQL cho môi trường dev) và mở nó lên trước.

```bash
npm install

# Tạo .env từ .env.example nếu chưa có (PowerShell)
# Copy-Item .env.example .env
# Đặt SESSION_SECRET thành chuỗi ngẫu nhiên riêng, không dùng giá trị mẫu.
# Sinh chuỗi: node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"

# Bật PostgreSQL dev (Docker, dữ liệu giữ trong volume "pgdata")
docker compose up -d

# Tạo bảng CSDL
npm run db:migrate

# Tạo tài khoản admin + dữ liệu mẫu
npm run db:seed
# (Máy đã có dữ liệu SQLite cũ drizzle/dev.db từ trước 06/10/2026: chạy
#  `npm run db:import-sqlite` THAY cho db:seed để chép toàn bộ dữ liệu cũ sang.)

# Chạy dev server
npm run dev
```

Mở http://localhost:3000 — website công khai.

Trước khi chạy server, cần có `.env` với `SESSION_SECRET`, Postgres đang chạy
(`docker compose up -d`), database đã migration và tài khoản đã seed. Thiếu các bước này, trang đăng nhập vẫn có thể mở nhưng
xác thực sẽ lỗi. Sau khi thay đổi cấu hình, khởi động lại server nếu cần.
Mở http://localhost:3000/admin — khu vực quản trị, đăng nhập bằng:

```
Email:     admin@hopluc.edu.vn
Mật khẩu:  HopLuc@2026
```

> ⚠️ Đây là tài khoản demo — **đổi mật khẩu hoặc tạo tài khoản mới, xoá tài
> khoản demo trước khi đưa lên môi trường thật** (xem mục 5).

## 2. Các lệnh có sẵn

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy dev server (http://localhost:3000) |
| `npm run build` | Build production |
| `npm run start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra lỗi code |
| `npm run db:generate` | Sinh migration sau khi sửa schema |
| `npm run db:migrate` | Áp dụng migration đã sinh vào database |
| `npm test` | Kiểm tra đầu vào API, luồng DB thử nghiệm, phân quyền và token xác thực |
| `npm run db:seed` | Tạo tài khoản admin + dữ liệu mẫu (chỉ tạo nếu chưa có, chạy lại an toàn) |
| `npm run db:import-sqlite` | Chép toàn bộ dữ liệu từ file SQLite cũ sang Postgres (thêm `-- --replace` để ghi đè) |
| `npm run db:studio` | Mở Drizzle Studio — xem/sửa dữ liệu trực quan qua trình duyệt |
| `docker compose up -d` / `docker compose stop` | Bật / tắt PostgreSQL dev (dữ liệu giữ nguyên) |

## 3. Cấu trúc thư mục

```
src/
  app/
    layout.tsx                # Root layout: khai báo font, metadata
    globals.css                # CSS biến toàn cục + Tailwind
    (site)/                    # Nhóm route website công khai (có Header/Footer chung)
      page.tsx                  # Trang chủ — đã dựng đầy đủ
      gioi-thieu/ , nganh-dao-tao/ , tuyen-sinh/ , tra-cuu-ket-qua/ ,
      tin-tuc/ , thu-vien/ , lms/ , lien-he/     # Đã có giao diện và luồng dữ liệu; LMS cần URL thật
    admin/
      dang-nhap/                 # Trang đăng nhập — Server Action loginAction() thật
      (dashboard)/                # Có sidebar, YÊU CẦU đăng nhập (chặn bởi src/proxy.ts)
        page.tsx                   # Dashboard — số liệu thật từ DB
        bai-viet/                  # CRUD bài viết thật (tạo/xoá/đăng-gỡ)
        tuyen-sinh/                 # Danh sách hồ sơ đăng ký, đổi trạng thái
        media/ , trang-tinh/        # Upload/xoá media, CRUD nội dung Markdown
    api/
      admissions/route.ts        # API nhận đăng ký xét tuyển từ form công khai, lưu DB thật
  components/
    ui/          # Button, Eyebrow, SectionHeading, PageStub
    site/        # SiteHeader, SiteFooter
    admin/       # AdminSidebar, AdminTopbar
  lib/
    constants.ts   # Thông tin trường, menu điều hướng, danh sách ngành đào tạo
    data/programs.ts  # Lớp truy xuất dữ liệu ngành đào tạo (xem mục 4)
    db/
      schema.ts    # Định nghĩa 25 bảng CSDL (PostgreSQL)
      client.ts    # Pool kết nối Postgres (driver pg, singleton)
      seed.ts      # Script tạo dữ liệu mẫu
      import-sqlite.ts  # Chép dữ liệu từ SQLite cũ sang Postgres (dùng 1 lần)
    auth.ts        # Hash mật khẩu (bcrypt) + ký/xác minh session cookie (HMAC)
    actions/auth-actions.ts   # Server Actions đăng nhập/đăng xuất
  proxy.ts       # (tên mới của "middleware" trong Next 16) — chặn /admin nếu chưa đăng nhập
drizzle/
  0000_init_postgres.sql  # Migration Postgres (sinh bằng db:generate)
  dev.db         # File SQLite cũ, chỉ để db:import-sqlite đọc (KHÔNG commit — có trong .gitignore)
docker-compose.yml  # PostgreSQL 17 cho dev
drizzle.config.ts
```

## 4. Nguyên tắc kiến trúc đã áp dụng

- **Design tokens tập trung** ở `tailwind.config.ts` — đổi màu thương hiệu chỉ cần sửa 1 chỗ.
- **Điều hướng tự nhận diện trang hiện tại** qua `usePathname()` trong `SiteHeader`/`AdminSidebar`.
- **Lớp truy xuất dữ liệu** (`lib/data/*.ts`): trang/component không đọc thẳng dữ liệu tĩnh hay gọi DB trực tiếp mà luôn qua các hàm ở đây — giúp sau này đổi nguồn dữ liệu (API khác, DB khác) chỉ cần sửa đúng 1 file.
- **Database dùng Drizzle ORM + PostgreSQL qua driver `pg`** — dev chạy Postgres trong Docker, production chạy Postgres trên VPS; chỉ khác `DATABASE_URL`. Xem chú thích đầu `src/lib/db/schema.ts` (kiểu cột giữ 1-1 với bản SQLite cũ, cột `seq` làm khoá phụ sắp xếp) và `src/lib/db/client.ts`.
- **Xác thực** bằng bcrypt + cookie HMAC; nhiều tài khoản với phân quyền module. Dashboard lọc dữ liệu theo quyền. Phiên và token reset gắn với phiên bản mật khẩu, mất hiệu lực khi mật khẩu thay đổi. Quyền `users` là quyền quản trị cấp cao vì cho phép cấp quyền và đổi mật khẩu tài khoản khác.

## 5. PostgreSQL (đã chuyển từ SQLite ngày 06/10/2026)

Hosting đã chọn: **VPS** — Postgres cài ngay trên VPS (hoặc chạy bằng chính
`docker-compose.yml` với mật khẩu mạnh), ảnh upload vẫn lưu `public/uploads/` trên
ổ đĩa VPS. Hướng dẫn cài + sao lưu: CLAUDE.md mục 9 "Postgres trên VPS".

Những điểm khác SQLite cần nhớ khi viết code:
- Danh sách luôn sắp xếp có khoá phụ `seq` cuối cùng (VD `orderBy: [asc(t.sortOrder), asc(t.seq)]`) — Postgres không giữ thứ tự chèn cho các dòng trùng khoá sắp xếp.
- Đếm dùng `count()` của Drizzle, không dùng ``sql`count(*)` `` (Postgres trả bigint → chuỗi).
- `like()` phân biệt hoa/thường (SQLite thì không) — cần không phân biệt thì dùng `ilike()`.
- Thời gian vẫn là `text` "YYYY-MM-DD HH:MM:SS" (UTC) như trước, hiển thị qua `formatDbDateTime()`.

## 6. Việc cần làm trước khi đưa lên môi trường thật (production)

1. **Đổi `SESSION_SECRET`** trong `.env` thành chuỗi ngẫu nhiên dài (không dùng giá trị mẫu).
2. **Xoá/đổi mật khẩu tài khoản admin demo** — sửa trực tiếp qua `db:studio` hoặc viết script riêng.
3. **Đặt `DATABASE_URL` trỏ tới Postgres trên VPS** với user/mật khẩu riêng, mạnh (không dùng `hopluc_dev`), chạy `npm run db:migrate`, rồi `npm run demo:clean` trước khi nhập dữ liệu thật.
4. **Sao lưu định kỳ** cả database (`pg_dump`) lẫn thư mục `public/uploads/` — ảnh nằm trên ổ đĩa VPS, không có bản sao nào khác.
5. Đặt `.env` thật ngoài git (đã có sẵn trong `.gitignore`).
6. **Chạy sau Nginx: đặt `TRUST_PROXY_HOPS="1"`** — để `0` thì mọi khách dùng chung 1 bộ đếm giới hạn (cả web chỉ nhận 5 hồ sơ tuyển sinh / 10 phút). Web in cảnh báo cấu hình còn thiếu ngay khi khởi động ở chế độ production.
7. **Theo dõi `/api/health`** (200 = CSDL + thư mục upload ổn, 503 = có lỗi) bằng dịch vụ uptime và sau mỗi lần triển khai.
8. `demo:load` không chạy được trên môi trường thật; `db:seed`/`db:import-sqlite` cần thêm `-- --allow-production` (seed khi đó lấy mật khẩu admin đầu tiên từ biến `SEED_ADMIN_PASSWORD`).

## 7. Kiểm tra và vận hành

- `npm test`, `npx tsc --noEmit` và `npm run lint` kiểm tra chức năng và mã nguồn. API test dùng PostgreSQL trong bộ nhớ (PGlite, không cần Docker), không truy cập DB thật hoặc gửi email.
- `npm run build` cần tải font Google khi chưa có cache. Trang chi tiết ngành đọc DB lúc có request; không cần DB lúc build.
- Sau cập nhật xác thực, phiên cookie cũ không có phiên bản mật khẩu bị từ chối: đăng nhập lại một lần.
- Cấu hình `TRUST_PROXY_HOPS` chỉ sau khi xác định chuỗi proxy tin cậy, proxy append IP thật/ghi đè header và origin chặn truy cập trực tiếp. Mặc định `0` không tin header và dùng bucket IP chung. Nhiều instance cần bộ đếm dùng chung thay cho Map trong tiến trình.
- Form tuyển sinh nhận slug ngành ổn định; vẫn nhận tên Việt/Anh từ client cũ. Số điện thoại hiện chấp nhận dạng di động Việt Nam 10 chữ số hoặc `+84`, CCCD 12 chữ số.
- Nội dung seed là mẫu: nhà trường phải duyệt số liệu, ảnh, liên kết và nội dung công khai trước khi public. Chỉ Giới thiệu/Chính sách còn `PageStub` dự phòng khi thiếu bản ghi; Liên hệ luôn giữ form.
- Hiệu ứng 3D ở thẻ ngành dùng CSS perspective, chỉ bật với chuột và tắt khi chọn giảm chuyển động.
- Turnstile chỉ gửi IP hợp lệ; có timeout khi xác minh. Giới hạn token và tham số tuỳ chọn theo [tài liệu Cloudflare](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
