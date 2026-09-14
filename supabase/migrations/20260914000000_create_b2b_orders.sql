-- ============================================================================
-- B2B Bayi & Sipariş Modülü — Migration
-- Fırat Elektronik / Unipro Katalog
--
-- Kurumsal bayilerin (organizations) katalogdan ürün seçip sipariş talebi
-- oluşturabilmesi için gerekli tabloları kurar.
--
-- enterprise-saas-starter mimarisinden esinlenilmiştir:
--   * Çok kiracılı (multi-tenant) yapı: her sipariş bir organization'a bağlıdır.
--   * Sipariş başlığı (orders) ile sipariş kalemleri (order_items) ayrılır.
--   * Birim fiyat, sipariş anında snapshot olarak order_items.unit_price'da tutulur
--     (ileride fiyat listesi değişse bile eski sipariş bozulmaz).
-- ============================================================================

-- gen_random_uuid() için pgcrypto (Supabase'de genellikle hazırdır, garanti için)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1) organizations — Kurumsal bayi (dealer) kayıtları
--    NOT: Bu tablo projede henüz yoktu. orders.organization_id FK'sı için gerekli.
--    enterprise-saas-starter'da zaten bir organizations tablonuz varsa bu bloğu
--    kaldırıp aşağıdaki FK'yı kendi tablonuza bağlayabilirsiniz.
-- ----------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,            -- Firma adı
  email text unique,             -- Bayi giriş e-postası
  phone text,                    -- İletişim telefonu
  address text,                  -- Fatura / teslimat adresi
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2) orders — Sipariş başlığı
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  total_amount numeric(12, 2) not null default 0
    check (total_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3) order_items — Sipariş kalemleri
--    product_id integer → products.id (integer) ile birebir eşleşir.
--    product silinmeye çalışılırsa FK (NO ACTION) bunu engeller — sipariş
--    geçmişi korunur.
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete cascade,
  product_id integer not null
    references public.products(id),
  quantity integer not null default 1
    check (quantity > 0),
  unit_price numeric(12, 2) not null default 0
    check (unit_price >= 0)
);

-- ----------------------------------------------------------------------------
-- İndeksler — Sorgu performansı
-- ----------------------------------------------------------------------------
create index if not exists idx_orders_organization_id on public.orders(organization_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) — enterprise-saas-starter güvenlik modeli
-- ----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- NOT: Bu iskelette yazma işlemleri sunucu tarafında SERVICE ROLE key ile yapılır
--      (bkz. lib/supabase-admin.ts), bu nedenle RLS bypass edilir ve uç istemciler
--      (anon/authenticated) varsayılan olarak hiçbir satır göremez — güvenli.
--
-- Doğrudan istemci erişimi eklemek isterseniz, auth.users -> organizations
-- bağlantısı için bir "organization_members" tablosu oluşturup şu tarz bir
-- politika ekleyebilirsiniz:
--
--   create policy "Bayiler kendi siparişlerini görür" on public.orders
--     for select using (
--       organization_id in (
--         select organization_id from public.organization_members
--         where user_id = auth.uid()
--       )
--     );
