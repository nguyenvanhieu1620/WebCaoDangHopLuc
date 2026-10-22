#!/usr/bin/env bash
# Triển khai bản mới nhất của nhánh main lên VPS (hướng dẫn đầy đủ: deploy/README.md). Chạy bằng user "hopluc":
#   sudo -u hopluc bash -c 'cd /srv/hopluc/repo && git pull -q --ff-only && bash deploy/scripts/deploy.sh'
#
# Mỗi lần tạo 1 thư mục releases/<thời điểm> (code + node_modules + bản build riêng), build xong mới đổi
# symlink "current" sang rồi khởi động lại → web chỉ gián đoạn vài giây, lỗi ở bước cài/build không ảnh
# hưởng bản đang chạy. Sau khi khởi động lại, /api/health không đạt trong 60 giây → tự quay về bản trước.
# Lưu ý: migration CSDL đã chạy thì KHÔNG tự hoàn tác khi quay về (migration chỉ nên thêm, không xoá cột).
#
# Biến tuỳ chỉnh: HOPLUC_BASE (mặc định /srv/hopluc), BRANCH (main), SERVICE (hopluc-web),
# HEALTH_URL (http://127.0.0.1:3000/api/health), KEEP_RELEASES (3).
set -Eeuo pipefail

BASE="${HOPLUC_BASE:-/srv/hopluc}"
BRANCH="${BRANCH:-main}"
SERVICE="${SERVICE:-hopluc-web}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"

REPO="$BASE/repo"
SHARED="$BASE/shared"
RELEASES="$BASE/releases"
CURRENT="$BASE/current"
NEW="$RELEASES/$(date +%Y%m%d-%H%M%S)"
SWITCHED=0

log() { printf '\n==> %s\n' "$*"; }
fail() { printf '\n✋ %s\n' "$*" >&2; exit 1; }
on_error() {
  if [[ "$SWITCHED" == 0 ]]; then
    printf '\n✋ Lỗi ở dòng %s — bản đang chạy KHÔNG bị ảnh hưởng (chưa chuyển sang bản mới).\n' "$1" >&2
    rm -rf "$NEW"
  fi
}
trap 'on_error $LINENO' ERR

# Không cho 2 lần triển khai chạy chồng nhau.
exec 9>"$BASE/.deploy.lock"
flock -n 9 || fail "Đang có 1 lần triển khai khác chạy."

[[ -f "$SHARED/.env" ]] || fail "Thiếu $SHARED/.env (xem deploy/README.md mục 5)."
[[ -d "$SHARED/uploads" ]] || fail "Thiếu thư mục $SHARED/uploads (xem deploy/README.md mục 3)."
grep -Eq '^TRUST_PROXY_HOPS="?[1-9]' "$SHARED/.env" || fail 'Chạy sau Nginx: .env phải có TRUST_PROXY_HOPS="1" (xem .env.example).'

log "Lấy code mới nhất (origin/$BRANCH)"
git -C "$REPO" fetch --prune origin
COMMIT="$(git -C "$REPO" rev-parse "origin/$BRANCH")"
mkdir -p "$NEW"
git -C "$REPO" archive "$COMMIT" | tar -x -C "$NEW"
echo "$COMMIT" > "$NEW/REVISION"

log "Gắn .env dùng chung"
ln -sfn "$SHARED/.env" "$NEW/.env"

cd "$NEW"
log "Cài thư viện (npm ci)"
# --include=dev: build cần TypeScript/Tailwind… kể cả khi shell lỡ đặt NODE_ENV=production.
npm ci --include=dev --no-audit --no-fund

log "Áp dụng migration CSDL"
npm run db:migrate

log "Build"
npm run build

# Thư mục ảnh tải lên dùng chung giữa các bản — gắn SAU khi build (Turbopack không lần theo symlink ra ngoài dự án).
rm -rf "$NEW/public/uploads"
ln -sfn "$SHARED/uploads" "$NEW/public/uploads"

PREV="$(readlink -f "$CURRENT" 2>/dev/null || true)"
log "Chuyển sang bản mới và khởi động lại $SERVICE"
ln -sfn "$NEW" "$CURRENT"
SWITCHED=1
# Khởi động lại lỗi cũng để bước kiểm tra sức khoẻ bên dưới quyết định (quay về bản trước).
# 9>&-: không truyền khoá triển khai sang tiến trình khác (giữ khoá thì lần triển khai sau bị chặn oan).
sudo systemctl restart "$SERVICE" 9>&- || true

healthy() {
  for _ in $(seq 1 30); do
    curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL" && return 0
    sleep 2
  done
  return 1
}

if healthy; then
  log "✓ Web đang chạy bản ${COMMIT:0:7} ($NEW)"
else
  printf '\n✋ %s không đạt sau 60 giây. Log gần nhất:\n' "$HEALTH_URL" >&2
  sudo journalctl -u "$SERVICE" -n 40 --no-pager >&2 || true
  if [[ -n "$PREV" && -d "$PREV" && "$PREV" != "$NEW" ]]; then
    printf '\n↩ Quay về bản trước: %s\n' "$PREV" >&2
    ln -sfn "$PREV" "$CURRENT"
    sudo systemctl restart "$SERVICE" 9>&-
  fi
  exit 1
fi

log "Dọn bản cũ (giữ $KEEP_RELEASES bản gần nhất)"
mapfile -t OLD < <(ls -1dt "$RELEASES"/*/ | tail -n +"$((KEEP_RELEASES + 1))")
for dir in "${OLD[@]}"; do
  [[ "$(readlink -f "$dir")" == "$(readlink -f "$CURRENT")" ]] || rm -rf "$dir"
done
