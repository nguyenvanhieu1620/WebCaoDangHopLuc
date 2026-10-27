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

const SESSION_COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-hopluc_admin_session" : "hopluc_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

const PLACEHOLDER_SECRET = "doi-chuoi-nay-thanh-ngau-nhien-that-dai-khi-deploy";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Thiếu biến môi trường SESSION_SECRET (xem .env.example)");
  }
  if (process.env.NODE_ENV === "production" && secret === PLACEHOLDER_SECRET) {
    throw new Error(
      "SESSION_SECRET vẫn là giá trị mẫu trong .env.example — đổi thành chuỗi ngẫu nhiên thật trước khi chạy production, nếu không session admin có thể bị giả mạo."
    );
  }
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error(
      "SESSION_SECRET quá ngắn (cần ít nhất 32 ký tự) — tạo chuỗi ngẫu nhiên bằng: openssl rand -base64 48"
    );
  }
  return secret;
}

/** Khoá con riêng theo mục đích; đổi SESSION_SECRET vô hiệu cả hai loại token. */
function signingKey(purpose: "session" | "reset"): Buffer {
  return crypto.createHmac("sha256", getSecret()).update(`hopluc:${purpose}:v1`).digest();
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  exp: number;
  credentialVersion?: string;
};

/** Không lưu password hash trong token; dấu phiên bản thay đổi khi đổi mật khẩu. */
export function credentialVersion(passwordHash: string): string {
  return crypto.createHash("sha256").update(passwordHash).digest("hex");
}

export function isCredentialCurrent(payload: { credentialVersion?: string }, passwordHash: string): boolean {
  return payload.credentialVersion === credentialVersion(passwordHash);
}

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
  const signature = crypto.createHmac("sha256", signingKey("session")).update(json).digest("hex");
  return `${json}.${signature}`;
}

/** Xác minh + giải mã cookie session. Trả về null nếu không hợp lệ hoặc hết hạn. */
export function verifySession(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  if (cookieValue.length > 4096) return null;
  const [json, signature] = cookieValue.split(".");
  if (!json || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", signingKey("session"))
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
    if (!payload || typeof payload.userId !== "string" || typeof payload.email !== "string" ||
        typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 phút — đủ dùng, không để link reset sống quá lâu

export type ResetTokenPayload = { userId: string; email: string; exp: number; credentialVersion: string };

/**
 * Token đặt lại mật khẩu — cùng cơ chế HMAC như session nhưng KHÔNG dùng
 * chung với session (khoá con riêng và tiền tố "reset:" khi ký) để 1 token
 * loại này không thể bị hiểu nhầm/dùng thay session hay ngược lại.
 */
export function signResetToken(userId: string, passwordHash: string, email: string): string {
  const payload: ResetTokenPayload = { userId, email, exp: Date.now() + RESET_TOKEN_TTL_MS, credentialVersion: credentialVersion(passwordHash) };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", signingKey("reset")).update(`reset:${json}`).digest("hex");
  return `${json}.${signature}`;
}

export function verifyResetToken(token: string): ResetTokenPayload | null {
  if (token.length > 4096) return null;
  const [json, signature] = token.split(".");
  if (!json || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", signingKey("reset"))
    .update(`reset:${json}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString()) as ResetTokenPayload;
    if (!payload || typeof payload.userId !== "string" || typeof payload.email !== "string" ||
        typeof payload.credentialVersion !== "string" || typeof payload.exp !== "number" ||
        !Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_MS };
