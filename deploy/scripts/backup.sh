#!/usr/bin/env bash
# Sao lưu CSDL (pg_dump) + thư mục ảnh/tài liệu tải lên thành 1 tệp mỗi ngày. Chạy bằng cron
# (deploy/cron/hopluc-backup) dưới user "hopluc"; chạy tay được: bash deploy/scripts/backup.sh
#
# CSDL có dữ liệu cá nhân (CCCD, số điện thoại thí sinh) → mã hoá bằng `age` khi có tệp khoá công khai
# ($AGE_RECIPIENTS). KHOÁ BÍ MẬT để giải mã KHÔNG nằm trên VPS (cất ở máy tính của trường) — VPS bị chiếm
# quyền cũng không đọc được bản sao lưu. Chỉ bản ĐÃ mã hoá mới được đẩy ra ngoài VPS (rclone).
#
# Giữ 7 bản theo ngày + 4 bản Chủ nhật. Khôi phục: deploy/README.md mục 10.
# Biến tuỳ chỉnh: HOPLUC_BASE (/srv/hopluc), BACKUP_DIR ($HOPLUC_BASE/backups),
# AGE_RECIPIENTS ($HOPLUC_BASE/backup-recipients.txt), RCLONE_REMOTE (trống = chỉ lưu trên VPS).
set -Eeuo pipefail
umask 077

BASE="${HOPLUC_BASE:-/srv/hopluc}"
SHARED="$BASE/shared"
DEST="${BACKUP_DIR:-$BASE/backups}"
AGE_RECIPIENTS="${AGE_RECIPIENTS:-$BASE/backup-recipients.txt}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
KEEP_DAILY=7
KEEP_WEEKS=4
STAMP="$(date +%F)"

fail() { printf '✋ %s\n' "$*" >&2; exit 1; }
echo "[$(date '+%F %T')] Bắt đầu sao lưu"

# Đọc DATABASE_URL từ .env (giữ nguyên ký tự đặc biệt trong mật khẩu, bỏ dấu nháy bao ngoài).
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$SHARED/.env" | tail -n 1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/' || true)"
[[ -n "$DATABASE_URL" ]] || fail "Không đọc được DATABASE_URL trong $SHARED/.env"

mkdir -p "$DEST/daily" "$DEST/weekly"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" --file="$WORK/db.dump"
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
  rclone delete "$RCLONE_REMOTE/daily/" --min-age "$((KEEP_DAILY * 4))d"
  echo "Đã đẩy ra ngoài: $RCLONE_REMOTE/daily/$(basename "$OUT")"
fi

find "$DEST/daily" -type f -name 'hopluc-*' -mtime +"$((KEEP_DAILY - 1))" -delete
find "$DEST/weekly" -type f -name 'hopluc-*' -mtime +"$((KEEP_WEEKS * 7))" -delete

echo "✓ Sao lưu xong: $OUT ($(du -h "$OUT" | cut -f1))"
