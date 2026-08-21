# Website Trường Cao đẳng Y Dược Hợp Lực

Base hệ thống Next.js 16 (App Router) + TypeScript + Tailwind CSS + Drizzle ORM
(SQLite), xây theo đúng thiết kế đã chốt (màu thương hiệu, font Fraunces/
Inter/IBM Plex Mono) từ bản mockup Claude Design.

## 1. Cài đặt & chạy lần đầu

```bash
npm install

# Tạo bảng CSDL (SQLite, file drizzle/dev.db)
npm run db:push

# Tạo tài khoản admin + dữ liệu mẫu
npm run db:seed

# Chạy dev server
npm run dev
```

Mở http://localhost:3000 — website công khai.
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
| `npm run db:push` | Đồng bộ schema (`src/lib/db/schema.ts`) vào database — chạy lại mỗi khi sửa schema |
| `npm run db:seed` | Tạo tài khoản admin + dữ liệu mẫu (chỉ tạo nếu chưa có, chạy lại an toàn) |
| `npm run db:studio` | Mở Drizzle Studio — xem/sửa dữ liệu trực quan qua trình duyệt |

## 3. Cấu trúc thư mục

```
src/
  app/
    layout.tsx                # Root layout: khai báo font, metadata
    globals.css                # CSS biến toàn cục + Tailwind
    (site)/                    # Nhóm route website công khai (có Header/Footer chung)
      page.tsx                  # Trang chủ — đã dựng đầy đủ
      gioi-thieu/ , nganh-dao-tao/ , tuyen-sinh/ , tra-cuu-ket-qua/ ,
      tin-tuc/ , thu-vien/ , lms/ , lien-he/     # Đang là khung PageStub, làm tiếp từng trang
    admin/
      dang-nhap/                 # Trang đăng nhập — Server Action loginAction() thật
      (dashboard)/                # Có sidebar, YÊU CẦU đăng nhập (chặn bởi src/proxy.ts)
        page.tsx                   # Dashboard — số liệu thật từ DB
        bai-viet/                  # CRUD bài viết thật (tạo/xoá/đăng-gỡ)
        tuyen-sinh/                 # Danh sách hồ sơ đăng ký, đổi trạng thái
        media/ , trang-tinh/        # Đang là khung PageStub, làm tiếp
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
      schema.ts    # Định nghĩa 5 bảng CSDL
      client.ts    # Kết nối SQLite (singleton)
      seed.ts      # Script tạo dữ liệu mẫu
    auth.ts        # Hash mật khẩu (bcrypt) + ký/xác minh session cookie (HMAC)
    actions/auth-actions.ts   # Server Actions đăng nhập/đăng xuất
  proxy.ts       # (tên mới của "middleware" trong Next 16) — chặn /admin nếu chưa đăng nhập
drizzle/
  dev.db         # File database SQLite (KHÔNG commit lên git — đã có trong .gitignore)
drizzle.config.ts
```

## 4. Nguyên tắc kiến trúc đã áp dụng

- **Design tokens tập trung** ở `tailwind.config.ts` — đổi màu thương hiệu chỉ cần sửa 1 chỗ.
- **Điều hướng tự nhận diện trang hiện tại** qua `usePathname()` trong `SiteHeader`/`AdminSidebar`.
- **Lớp truy xuất dữ liệu** (`lib/data/*.ts`): trang/component không đọc thẳng dữ liệu tĩnh hay gọi DB trực tiếp mà luôn qua các hàm ở đây — giúp sau này đổi nguồn dữ liệu (API khác, DB khác) chỉ cần sửa đúng 1 file.
- **Database dùng Drizzle ORM + SQLite qua `@libsql/client`** — thiết kế portable sang PostgreSQL (Amazon RDS Aurora) gần như không cần sửa code, xem chú thích trong `src/lib/db/schema.ts` và `src/lib/db/client.ts`.
  > **Vì sao không dùng `better-sqlite3`?** Gói đó cần biên dịch native (node-gyp + Python) lúc `npm install` — nhiều máy Windows không có sẵn Python nên cài lỗi. `@libsql/client` cũng là SQLite nhưng dùng binary dựng sẵn theo từng hệ điều hành (napi-rs), tải tự động qua npm, không cần biên dịch gì cả.
- **Xác thực tự viết gọn nhẹ** (bcrypt + session cookie ký HMAC) thay vì thư viện nặng — đủ dùng cho 1 quản trị viên. Khi cần nhiều vai trò/phân quyền phức tạp hơn, cân nhắc chuyển sang Auth.js hoặc Amazon Cognito (đúng hướng SRS) mà không phải đập hết — chỉ thay `lib/auth.ts` và `proxy.ts`.

## 5. Lộ trình chuyển sang PostgreSQL (đã thống nhất)

**Quyết định:** hoàn thiện toàn bộ các trang bằng SQLite trước (đang dùng hiện tại),
**sau khi web hoàn thiện mới chuyển sang PostgreSQL** trước khi đưa lên mạng cho
người dùng thật. SQLite (file-based) không phù hợp để chạy production thật —
xử lý ghi đồng thời hạn chế, không đồng bộ được giữa nhiều server khi scale.

Khi tới lúc chuyển đổi, có 2 lựa chọn (chọn lúc đó tuỳ tình hình):
- **PostgreSQL miễn phí trên mạng (Neon/Supabase)** — nhanh gọn, không cần tài khoản AWS trước, tương thích 100% để chuyển tiếp lên Aurora sau này.
- **Amazon RDS Aurora PostgreSQL** — đúng kiến trúc dài hạn trong SRS, cần tài khoản AWS.

Vì schema (`src/lib/db/schema.ts`) và client (`src/lib/db/client.ts`) đã viết theo
Drizzle ORM ở dạng portable, việc chuyển đổi dự kiến chỉ cần:
1. Đổi `datasource`/import trong `schema.ts`: `drizzle-orm/sqlite-core` → `drizzle-orm/pg-core` (tên các kiểu cột gần như 1-1).
2. Đổi driver kết nối trong `client.ts`: `better-sqlite3` → `pg`/`postgres` driver tương ứng.
3. Đổi `DATABASE_URL` trong `.env` sang connection string PostgreSQL.
4. Chạy lại `npm run db:push` + `npm run db:seed` trên DB mới.

Toàn bộ code ở các trang, Server Actions, API route (gọi `db.select()/.insert()/...`)
**không cần sửa** vì cú pháp Drizzle giống nhau giữa 2 dialect.

## 6. Việc cần làm trước khi đưa lên môi trường thật (production)

1. **Đổi `SESSION_SECRET`** trong `.env` thành chuỗi ngẫu nhiên dài (không dùng giá trị mẫu).
2. **Xoá/đổi mật khẩu tài khoản admin demo** — sửa trực tiếp qua `db:studio` hoặc viết script riêng.
3. **Chuyển `DATABASE_URL` sang PostgreSQL thật** khi lên AWS (Amazon RDS Aurora) — xem hướng dẫn trong `src/lib/db/schema.ts`.
4. **Cấu hình lưu trữ file thật** cho phần "Thư viện media" (hiện là khung tạm) — dùng Amazon S3 khi lên production.
5. Đặt `.env` thật ngoài git (đã có sẵn trong `.gitignore`), dùng biến môi trường của nền tảng hosting (Vercel/AWS) thay vì file `.env` khi deploy.

## 7. Việc tiếp theo (làm từng trang)

Các trang còn ở dạng khung tạm (`PageStub`) đã có sẵn `eyebrow`/`title`/`description` đúng ngữ cảnh — chỉ cần thay bằng nội dung thật, tham khảo bản thiết kế gốc trong file `.dc.html` tương ứng (Claude Design) để giữ đúng bố cục.
