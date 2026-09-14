import { createHmac, timingSafeEqual } from "crypto";

// 7 gün geçerli oturum
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "KRİTİK HATA: ADMIN_SESSION_SECRET .env.local dosyasında bulunamadı!",
    );
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

/**
 * İmzalı, süresi dolan bir admin oturum token'ı oluşturur.
 * Format: base64url(payload).base64url(hmac-sha256 imzası)
 */
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString(
    "base64url",
  );

  return `${payload}.${sign(payload)}`;
}

/**
 * Token'ın imzasını (timing-safe) ve süresini doğrular.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payload, signature] = parts;

  let signatureBuffer: Buffer;
  let expectedBuffer: Buffer;
  try {
    signatureBuffer = Buffer.from(signature, "base64url");
    expectedBuffer = Buffer.from(sign(payload), "base64url");
  } catch {
    return false;
  }

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;
