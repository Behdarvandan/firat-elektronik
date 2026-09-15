-- ============================================================================
-- B2B Bayi & Sipariş Modülü — orders.note kolonu
-- Fırat Elektronik / Unipro Katalog
--
-- Bayinin sipariş onay (checkout) ekranında bırakabileceği opsiyonel not.
-- Mevcut "orders" tablosuna idempotent olarak eklenir.
-- ============================================================================

alter table public.orders add column if not exists note text;
