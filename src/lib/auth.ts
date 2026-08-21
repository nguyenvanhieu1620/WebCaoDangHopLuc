import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Xác thực đăng nhập admin — cookie session tự ký bằng HMAC (không phụ thuộc
 * thư viện auth ngoài, phù hợp base gọn cho giai đoạn 1 người tự triển khai).
 *
 * Cookie value: "<base64(payload JSON)>.<chữ ký HMAC-SHA256>"
 * Payload gồm { userId, email, exp } — exp là mốc hết hạn (unix ms).
 *
 * Khi cần nâng cấp (nhiều quản trị viên, phân quyền chi tiết, SSO...), có thể
 * thay bằng NextAuth/Auth.js hoặc Amazon Cognito (đúng hướng SRS) — middleware.ts
 * và các nơi gọi `getSession()` không cần đổi nhiều vì đã tách riêng file này.
 */

const SESSION_COOKIE_NAME = "hopluc_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Thiếu biến môi trường SESSION_SECRET (xem .env.example)");
  }
  return secret;
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  exp: number;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Tạo giá trị cookie session đã ký, dùng để set vào response. */
export function signSession(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const json = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(json).digest("hex");
  return `${json}.${signature}`;
}

/** Xác minh + giải mã cookie session. Trả về null nếu không hợp lệ hoặc hết hạn. */
export function verifySession(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  const [json, signature] = cookieValue.split(".");
  if (!json || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(json)
    .digest("hex");

  // So sánh an toàn theo thời gian không đổi, tránh timing attack.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_MS };
