/**
 * White-label site configuration.
 *
 * Every value below is read from an env variable and falls back to the
 * current (Fırat Elektronik / Unipro) demo defaults. To rebrand this
 * template for a new client, set the corresponding NEXT_PUBLIC_* variables
 * in `.env.local` (see `.env.example`) — no source changes needed.
 *
 * NEXT_PUBLIC_ prefix is required because these values are consumed by
 * client components (Navbar, admin login/layout) in addition to server
 * components, and Next.js only inlines prefixed env vars into the browser
 * bundle.
 */

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "Fırat Elektronik";

export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE || "B2B Ürün Kataloğu";

export const FOOTER_TEXT =
  process.env.NEXT_PUBLIC_FOOTER_TEXT ||
  "© 2026 Fırat Elektronik. Tüm Hakları Saklıdır.";

export const ADMIN_PANEL_NAME =
  process.env.NEXT_PUBLIC_ADMIN_PANEL_NAME || "Unipro Admin";
