#!/usr/bin/env bash
# Sao lưu CSDL (pg_dump) + thư mục ảnh/tài liệu tải lên thành 1 tệp mỗi ngày. Chạy bằng cron
# (deploy/cron/hopluc-backup) dưới user riêng "hopluc-backup"; script được cài root-owned.
#
# CSDL có dữ liệu cá nhân (CCCD, số điện thoại thí sinh) → mã hoá bằng `age` khi có tệp khoá công khai
# ($AGE_RECIPIENTS). KHOÁ BÍ MẬT để giải mã KHÔNG nằm trên VPS (cất ở máy tính của trường) — VPS bị chiếm
# quyền cũng không đọc được bản sao lưu. Chỉ bản ĐÃ mã hoá mới được đẩy ra ngoài VPS (rclone).
#
# Giữ 7 bản theo ngày + 4 bản Chủ nhật. Khôi phục: deploy/README.md mục 10.
# Biến tuỳ chỉnh: HOPLUC_BASE (/srv/hopluc), BACKUP_DIR ($HOPLUC_BASE/backups),
# AGE_RECIPIENTS ($HOPLUC_BASE/backup-recipients.txt), BACKUP_ENV_FILE ($HOPLUC_BASE/shared/.env),
# RCLONE_REMOTE (trống = chỉ lưu trên VPS). Cài production dùng file env riêng chỉ chứa DATABASE_URL.
set -Eeuo pipefail
umask 077

BASE="${HOPLUC_BASE:-/srv/hopluc}"
SHARED="$BASE/shared"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-$SHARED/.env}"
DEST="${BACKUP_DIR:-$BASE/backups}"
AGE_RECIPIENTS="${AGE_RECIPIENTS:-$BASE/backup-recipients.txt}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
KEEP_DAILY=7
KEEP_WEEKS=4
STAMP="$(date +%F)"

fail() { printf '✋ %s\n' "$*" >&2; exit 1; }
echo "[$(date '+%F %T')] Bắt đầu sao lưu"

# Đọc DATABASE_URL từ .env (giữ nguyên ký tự đặc biệt trong mật khẩu, bỏ dấu nháy bao ngoài).
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$BACKUP_ENV_FILE" | tail -n 1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/' || true)"
[[ -n "$DATABASE_URL" ]] || fail "Không đọc được DATABASE_URL trong $BACKUP_ENV_FILE"

mkdir -p "$DEST/daily" "$DEST/weekly"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Không đưa mật khẩu vào tham số lệnh (ai trên máy cũng đọc được /proc/<pid>/cmdline): tách mật khẩu ra
# tệp pgpass quyền 600 (umask 077), URL truyền cho pg_dump không còn mật khẩu. URL đi qua biến môi
# trường (chỉ chính user này đọc được), không qua tham số của node.
export PGPASSFILE="$WORK/pgpass"
DB_URL_NOPASS="$(DATABASE_URL="$DATABASE_URL" PGPASSFILE="$PGPASSFILE" node -e '
  const fs = require("fs");
  const u = new URL(process.env.DATABASE_URL);
  const esc = (v) => v.replace(/[\\:]/g, (c) => "\\" + c);
  const password = u.searchParams.get("password") ?? decodeURIComponent(u.password);
  if (/[\r\n]/.test(password)) throw new Error("Invalid database password format");
  fs.writeFileSync(process.env.PGPASSFILE, "*:*:*:*:" + esc(password) + "\n", { mode: 0o600 });
  u.password = "";
  u.searchParams.delete("password");
  process.stdout.write(u.toString());
')" || fail "DATABASE_URL trong $SHARED/.env không đúng dạng postgres://…"
pg_dump --format=custom --no-owner --no-privileges --dbname="$DB_URL_NOPASS" --file="$WORK/db.dump"
tar -czf "$WORK/uploads.tar.gz" -C "$SHARED" uploads
tar -cf "$WORK/hopluc-$STAMP.tar" -C "$WORK" db.dump uploads.tar.gz

if [[ -s "$AGE_RECIPIENTS" ]]; then
  OUT="$DEST/daily/hopluc-$STAMP.tar.age"
  age --encrypt --recipients-file "$AGE_RECIPIENTS" --output "$OUT" "$WORK/hopluc-$STAMP.tar"
else
  OUT="$DEST/daily/hopluc-$STAMP.tar"
  mv "$WORK/hopluc-$STAMP.tar" "$OUT"
  echo "⚠️  Chưa có khoá công khai ($AGE_RECIPIENTS) — bản sao lưu KHÔNG được mã hoá."
fi

# Chủ nhật: giữ thêm 1 bản theo tuần.
if [[ "$(date +%u)" == 7 ]]; then cp "$OUT" "$DEST/weekly/"; fi

if [[ -n "$RCLONE_REMOTE" ]]; then
  [[ "$OUT" == *.age ]] || fail "Không đẩy bản CHƯA mã hoá ra ngoài VPS — tạo khoá age trước (deploy/README.md mục 9)."
  rclone copy "$OUT" "$RCLONE_REMOTE/daily/"
  if [[ "$(date +%u)" == 7 ]]; then rclone copy "$OUT" "$RCLONE_REMOTE/weekly/"; fi
  # Không xoá remote bằng credential trên VPS. Cấu hình lifecycle ở nhà cung cấp:
  # daily 7 ngày, weekly 28 ngày; quyền remote nên chỉ cho thêm bản mới.
  echo "Đã đẩy ra ngoài: $RCLONE_REMOTE/daily/$(basename "$OUT")"
fi

find "$DEST/daily" -type f -name 'hopluc-*' -mtime +"$((KEEP_DAILY - 1))" -delete
find "$DEST/weekly" -type f -name 'hopluc-*' -mtime +"$((KEEP_WEEKS * 7))" -delete

echo "✓ Sao lưu xong: $OUT ($(du -h "$OUT" | cut -f1))"
