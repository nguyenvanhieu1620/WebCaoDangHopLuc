# Triển khai lên VPS (Ubuntu 24.04)

Bộ file trong thư mục này dựng web trên 1 VPS: **Nginx** (https) → **Next.js** chạy bằng systemd (1 tiến
trình, cổng 3000 chỉ mở trong máy) → **PostgreSQL 17** cùng máy. Cấu hình khuyến nghị: 2 vCPU, 4GB RAM,
60–80GB SSD, IPv4 tĩnh, đặt tại Việt Nam.

| File | Đặt ở VPS | Việc |
|---|---|---|
| `nginx/hopluc.conf` | `/etc/nginx/sites-available/hopluc` | https, www → tên miền chính, nhận file 60MB, giới hạn tần suất API, phục vụ ảnh tải lên |
| `systemd/hopluc-web.service` | `/etc/systemd/system/` | chạy web, tự bật lại khi lỗi/khởi động máy |
| `sudoers/hopluc` | `/etc/sudoers.d/hopluc` | cho user `hopluc` khởi động lại web khi triển khai |
| `cron/hopluc-backup` | `/etc/cron.d/hopluc-backup` | sao lưu 2:15 sáng mỗi ngày |
| `scripts/deploy.sh` | (chạy từ repo) | triển khai bản mới, tự quay về bản cũ nếu lỗi |
| `scripts/backup.sh` | (cron gọi) | sao lưu CSDL + ảnh, mã hoá, giữ 7 ngày + 4 tuần |

Sơ đồ thư mục trên VPS:

```
/srv/hopluc/
├── repo/                  bản clone Git (nguồn code)
├── releases/<thời điểm>/  mỗi lần triển khai 1 thư mục (code + node_modules + bản build), giữ 3 bản
├── current → releases/…   bản đang chạy (systemd chạy từ đây)
├── shared/.env            cấu hình thật (quyền 600)
├── shared/uploads/        ảnh/video/tài liệu admin tải lên — dùng chung mọi bản
├── backups/               bản sao lưu hằng ngày
└── backup-recipients.txt  khoá CÔNG KHAI để mã hoá bản sao lưu
```

Các lệnh dưới đây chạy bằng 1 user quản trị có `sudo` (không phải root).

## 1. Bảo vệ VPS cơ bản

```bash
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
sudo apt update && sudo apt -y upgrade
sudo apt install -y ufw fail2ban unattended-upgrades
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable
```

- **SSH chỉ dùng khoá:** trên máy tính chạy `ssh-copy-id <user>@<IP>`, thử đăng nhập lại bằng khoá được, rồi
  sửa `/etc/ssh/sshd_config`: `PermitRootLogin no`, `PasswordAuthentication no` → `sudo systemctl restart ssh`.
- **Swap 2GB** (build Next.js tốn RAM): `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab`
- **Giới hạn log hệ thống 500MB:** đặt `SystemMaxUse=500M` trong `/etc/systemd/journald.conf` →
  `sudo systemctl restart systemd-journald`.

## 2. Cài phần mềm

```bash
# Node.js 24 (khớp .nvmrc) — nằm ở /usr/bin/node như file systemd mong đợi
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 17 từ kho chính thức — Ubuntu 24.04 mặc định là bản 16, KHÔNG khôi phục được bản sao lưu
# từ máy dev (Postgres 17) và pg_dump phải cùng/mới hơn máy chủ.
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt install -y postgresql-17

sudo apt install -y nginx certbot git curl age
sudo apt install -y rclone   # tuỳ chọn — đẩy bản sao lưu ra ngoài VPS (mục 9)
```

## 3. User chạy web + thư mục

```bash
sudo adduser --system --group --home /srv/hopluc --shell /bin/bash hopluc
sudo -u hopluc mkdir -p /srv/hopluc/shared/uploads /srv/hopluc/releases /srv/hopluc/backups
# Nginx (user www-data) phải đọc được ảnh tải lên
sudo chmod 755 /srv/hopluc /srv/hopluc/shared /srv/hopluc/shared/uploads
```

Lấy code (repo riêng tư → tạo **deploy key** chỉ đọc):

```bash
sudo -u hopluc ssh-keygen -t ed25519 -N "" -f /srv/hopluc/.ssh/id_ed25519
sudo cat /srv/hopluc/.ssh/id_ed25519.pub
# GitHub → repo → Settings → Deploy keys → Add deploy key (KHÔNG tick "Allow write access") → dán khoá trên
sudo -u hopluc git clone git@github.com:nguyenvanhieu1620/WebCaoDangHopLuc.git /srv/hopluc/repo
```

## 4. Cơ sở dữ liệu

```bash
sudo -u postgres psql -c "CREATE USER hopluc WITH PASSWORD '<mật-khẩu-mạnh>';"
sudo -u postgres createdb -O hopluc hopluc
```

Postgres cùng máy, chỉ nghe `localhost` (mặc định) — không mở cổng 5432 ra ngoài.

**Chép dữ liệu đang có ở máy dev** (khuyến nghị):

1. Trên máy dev: `npm run demo:clean` (gỡ ảnh/giảng viên demo — người mẫu Unsplash), rồi
   `docker compose exec -T postgres pg_dump -U hopluc -Fc hopluc > hopluc.dump` và nén thư mục `public/uploads`.
2. Chép lên VPS (`scp`), rồi:

```bash
pg_restore --no-owner --role=hopluc -d "postgres://hopluc:<mật-khẩu>@localhost:5432/hopluc" hopluc.dump
sudo tar -xzf uploads.tar.gz -C /srv/hopluc/shared && sudo chown -R hopluc:hopluc /srv/hopluc/shared/uploads
```

**Hoặc bắt đầu trống:** bỏ qua bước trên; sau lần triển khai đầu (mục 7) tạo admin đầu tiên:
`cd /srv/hopluc/current && sudo -u hopluc env SEED_ADMIN_PASSWORD='<ít nhất 12 ký tự>' npm run db:seed -- --allow-production`
(seed cũng tạo nội dung khung mẫu — phải sửa lại trước khi công bố).

## 5. File cấu hình `.env`

```bash
sudo -u hopluc cp /srv/hopluc/repo/.env.example /srv/hopluc/shared/.env
sudo -u hopluc chmod 600 /srv/hopluc/shared/.env
sudo -u hopluc nano /srv/hopluc/shared/.env
```

Bắt buộc sửa:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | `"postgres://hopluc:<mật-khẩu>@localhost:5432/hopluc"` |
| `SESSION_SECRET` | chuỗi ngẫu nhiên: `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | `"https://<tên-miền>"` (gắn vào lúc build — đổi thì triển khai lại) |
| `TRUST_PROXY_HOPS` | `"1"` (chạy sau Nginx — để `0` thì cả web chỉ nhận 5 hồ sơ / 10 phút) |

Tuỳ chọn: `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (email), `DEEPL_API_KEY` (dịch), Turnstile, Google Analytics —
xem chú thích trong `.env.example`. Web in cảnh báo cấu hình còn thiếu vào log lúc khởi động.

## 6. Dịch vụ systemd + quyền khởi động lại

```bash
cd /srv/hopluc/repo
sudo cp deploy/systemd/hopluc-web.service /etc/systemd/system/
sudo install -m 440 deploy/sudoers/hopluc /etc/sudoers.d/hopluc && sudo visudo -c
sudo systemctl daemon-reload && sudo systemctl enable hopluc-web
```

## 7. Triển khai

```bash
sudo -u hopluc bash -c 'cd /srv/hopluc/repo && git pull -q --ff-only && bash deploy/scripts/deploy.sh'
```

Script: lấy `origin/main` → thư mục `releases/<thời điểm>` → `npm ci` → migration → build → đổi `current` →
khởi động lại → chờ `/api/health` đạt (tối đa 60 giây); không đạt thì **tự quay về bản trước** và in log.
Lỗi ở bước cài/build không ảnh hưởng bản đang chạy. Migration đã chạy thì không tự hoàn tác — migration chỉ
nên thêm bảng/cột, không xoá.

Các lần cập nhật sau: push code lên `main` rồi chạy lại đúng lệnh trên.

**Quay về bản cũ bằng tay:** `ls -1t /srv/hopluc/releases` →
`sudo -u hopluc ln -sfn /srv/hopluc/releases/<bản> /srv/hopluc/current && sudo systemctl restart hopluc-web`

## 8. Tên miền + https + Nginx

1. Trỏ bản ghi DNS **A** của `<tên-miền>` và `www.<tên-miền>` về IP VPS; chờ `ping <tên-miền>` ra đúng IP.
2. Lấy chứng chỉ Let's Encrypt (tự gia hạn; mỗi lần gia hạn Nginx tắt vài giây lúc nửa đêm):

```bash
sudo certbot certonly --standalone -d <tên-miền> -d www.<tên-miền> -m <email-nhà-trường> --agree-tos --no-eff-email \
  --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"
sudo certbot renew --dry-run
```

3. Bật cấu hình Nginx:

```bash
sed 's/__DOMAIN__/<tên-miền>/g' /srv/hopluc/repo/deploy/nginx/hopluc.conf | sudo tee /etc/nginx/sites-available/hopluc >/dev/null
sudo ln -s /etc/nginx/sites-available/hopluc /etc/nginx/sites-enabled/hopluc
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl -s https://<tên-miền>/api/health
```

## 9. Sao lưu

**Khoá mã hoá** (bản sao lưu có CCCD, SĐT thí sinh): tạo trên **máy tính của trường**, không phải VPS.

```bash
# Windows: winget install FiloSottile.age   ·   macOS: brew install age
age-keygen -o hopluc-backup-key.txt
```

- Cất `hopluc-backup-key.txt` ở 2 nơi an toàn (VD USB + trình quản lý mật khẩu). **Mất khoá = không đọc được
  bản sao lưu nào.**
- Chép dòng `# public key: age1…` (chỉ phần `age1…`) vào `/srv/hopluc/backup-recipients.txt` trên VPS.

Bật sao lưu hằng ngày và chạy thử 1 lần:

```bash
sudo install -m 644 /srv/hopluc/repo/deploy/cron/hopluc-backup /etc/cron.d/hopluc-backup
sudo -u hopluc bash /srv/hopluc/current/deploy/scripts/backup.sh
```

**Đẩy ra ngoài VPS** (nên có — VPS hỏng là mất cả bản sao lưu nằm trên nó): `sudo -u hopluc rclone config`
tạo remote (Google Drive, OneDrive, S3…), rồi bỏ `#` ở dòng `RCLONE_REMOTE=` trong `/etc/cron.d/hopluc-backup`.
Chỉ bản đã mã hoá mới được đẩy đi.

## 10. Khôi phục từ bản sao lưu

Trên máy có khoá bí mật: `age -d -i hopluc-backup-key.txt hopluc-<ngày>.tar.age > hopluc.tar && tar -xf hopluc.tar`
(ra `db.dump` + `uploads.tar.gz`), chép lên VPS rồi:

```bash
sudo systemctl stop hopluc-web
pg_restore --clean --if-exists --no-owner --role=hopluc -d "postgres://hopluc:<mật-khẩu>@localhost:5432/hopluc" db.dump
sudo -u hopluc tar -xzf uploads.tar.gz -C /srv/hopluc/shared
sudo systemctl start hopluc-web && curl -s http://127.0.0.1:3000/api/health
```

**Mỗi tháng thử khôi phục 1 lần** vào DB nháp (`createdb hopluc_thu` → `pg_restore` → xem số dòng → `dropdb`)
— bản sao lưu chưa từng khôi phục thử thì chưa chắc dùng được.

## 11. Theo dõi

- **Uptime:** tạo tài khoản miễn phí tại uptimerobot.com → monitor HTTP(s) `https://<tên-miền>/api/health`,
  5 phút/lần, báo qua email/Telegram. Trang trả 503 khi CSDL lỗi, thư mục ảnh không ghi được hoặc ổ đĩa
  còn dưới 1GB (`HEALTH_MIN_FREE_MB`).
- **Log web:** `journalctl -u hopluc-web -f` (cảnh báo cấu hình in ngay lúc khởi động).
- **Log Nginx:** `/var/log/nginx/hopluc.access.log`, `hopluc.error.log` (logrotate có sẵn tự xoay vòng).
- **Log sao lưu:** `/srv/hopluc/backups/backup.log`.
