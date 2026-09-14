import { createHmac, timingSafeEqual } from "crypto";

// 7 gün geçerli bayi oturumu (admin oturumuyla aynı süre)
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Çerez adı — sunucu aksiyonları ve sayfa bileşeni bu ismi paylaşır
export const B2B_SESSION_COOKIE = "b2b_session";

export interface B2bSessionPayload {
  organizationId: string;
  email: string;
  name: string;
  exp: number;
}

function getSecret(): string {
  // Bayi oturumları için ayrı imza anahtarı kullanılır.
  // Üretim ortamında B2B_SESSION_SECRET tanımlı olmalıdır; yoksa güvenli bir
  // geri dönüş olarak mevcut ADMIN_SESSION_SECRET'a düşer (iskelet için).
  const secret =
    process.env.B2B_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "KRİTİK HATA: B2B_SESSION_SECRET (veya ADMIN_SESSION_SECRET) .env.local dosyasında bulunamadı!",
    );
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * İmzalı, süresi dolan bir bayi oturum token'ı oluşturur.
 * Format: base64url(JSON-payload).base64url(hmac-sha256 imzası)
 */
export function createB2bSessionToken(data: {
  organizationId: string;
  email: string;
  name: string;
}): string {
  const payload: B2bSessionPayload = {
    ...data,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Token'ın imzasını (timing-safe) ve süresini doğrular; geçerliyse payload'ı döner.
 * Geçersiz / süresi dolmuş token için null döner.
 */
export function verifyB2bSessionToken(
  token: string | undefined | null,
): B2bSessionPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  let signatureBuffer: Buffer;
  let expectedBuffer: Buffer;
  try {
    signatureBuffer = Buffer.from(signature, "base64url");
    expectedBuffer = Buffer.from(sign(payload), "base64url");
  } catch {
    return null;
  }

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as B2bSessionPayload;

    if (typeof parsed.exp !== "number" || Date.now() >= parsed.exp) {
      return null;
    }
    if (!parsed.organizationId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export const B2B_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;
