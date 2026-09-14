# UNIPRO Katalog - Teknik Mimari Dokümantasyonu

## 📋 Proje Özeti

**UNIPRO Katalog**, telefon ekran koruyucu/cam ürünlerinin markalar ve modeller bazında uyumluluğunu gösteren bir katalog uygulamasıdır.

---

## 🛠️ Teknoloji Stack

### Core Framework

- **Next.js**: 16.2.7 (App Router)
- **React**: 19.2.4
- **TypeScript**: 5.x
- **Node.js**: 20.x

### Styling

- **Tailwind CSS**: 4.x (PostCSS ile)
- **Google Fonts**: Geist, Geist Mono

### Database & Backend

- **Supabase**: PostgreSQL veritabanı + Client SDK (@supabase/supabase-js 2.107.0)
- **API Routes**: Next.js App Router API endpoints

### Development Tools

- **ESLint**: 9.x (Next.js config)
- **PostCSS**: Tailwind CSS işleme

---

## 📁 Dizin Yapısı

```
unipro-katalog/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout (Geist fonts, global styles)
│   ├── page.tsx                 # Ana sayfa (kategori listesi)
│   ├── globals.css              # Tailwind directives + global styles
│   ├── favicon.ico              # Site ikonu
│   └── api/
│       └── seed/
│           └── route.ts         # Veritabanı seed endpoint (GET/POST)
│
├── lib/
│   └── supabase.ts              # Supabase client singleton
│
├── data/                         # JSON veri dosyaları (seed için)
│   ├── homepage.json            # Anasayfa verileri + kategoriler
│   ├── samsung.json             # Samsung ürünleri
│   ├── apple.json               # Apple ürünleri
│   ├── huwai.json               # Huawei ürünleri
│   ├── oppo.json                # Oppo ürünleri
│   └── xiaomi.json              # Xiaomi ürünleri
│
├── public/                       # Statik dosyalar
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── package.json                  # Bağımlılıklar
├── tsconfig.json                # TypeScript konfigürasyonu
├── next.config.ts               # Next.js konfigürasyonu
├── postcss.config.mjs           # PostCSS konfigürasyonu
├── eslint.config.mjs            # ESLint konfigürasyonu
└── .gitignore                   # Git ignore patterns
```

---

## 🗄️ Veritabanı Şeması (Supabase PostgreSQL)

### 1. `categories` Tablosu

Ürün kategorilerini (VELA TEMPERED GLASS vs.) tutar.

```typescript
interface Category {
  id: number; // Primary key
  name: string; // Kategori adı (ör: "UNIPRO #1 VELA TEMPERED GLASS")
  color: string; // Hex renk kodu (ör: "#007bff")
  prefix: string | null; // Opsiyonel prefix
}
```

**İlişkiler:**

- `products.category_id` → `categories.id` (One-to-Many)

---

### 2. `products` Tablosu

Ana ürünleri (kutular/box'lar) tutar.

```typescript
interface Product {
  id: number; // Primary key
  category_id: number; // Foreign key → categories.id
  name: string; // Ürün adı (ör: "A11X")
  box_code: string; // Kutu kodu (ör: "UNIPRO H01")
  box_code_note: string; // Kutu kodu notu
  capacity: string; // Kapasite bilgisi
  product_code: string; // Ürün kodu
  specs: object; // JSON formatında ek özellikler
}
```

**İlişkiler:**

- `category_id` → `categories.id` (Many-to-One)
- `product_models.product_id` → `products.id` (One-to-Many)

---

### 3. `product_models` Tablosu

Her ürünün uyumlu olduğu telefon modellerini tutar (arama hedefleri).

```typescript
interface ProductModel {
  id: string; // Primary key (ör: "1_0", "1_1")
  product_id: number; // Foreign key → products.id
  model_name: string; // Telefon model adı (ör: "SAMSUNG A02")
  sort_order: number; // Sıralama değeri
  is_new: boolean; // Yeni model işareti
}
```

**İlişkiler:**

- `product_id` → `products.id` (Many-to-One)

---

## 🔄 Veri Akışı

### Seed İşlemi (Data Import)

1. **Kaynak**: `/data/*.json` dosyaları
2. **Endpoint**: `GET/POST /api/seed`
3. **İşlem**:
   - JSON dosyalarını okur ve temizler (satır atlamalarını düzeltir)
   - Tüm markaların ürünlerini birleştirir
   - ID bazlı tekilleştirme yapar
   - Supabase'e upsert eder (categories → products → product_models)
4. **Response**: İstatistikler (kaç kategori/ürün/model eklendi)

### Ana Sayfa Render (SSR)

1. **Component**: `app/page.tsx`
2. **Veri Çekme**: Server-side
   ```typescript
   export const revalidate = 0; // Her istekte yeni veri
   const { data: categories } = await supabase
     .from("categories")
     .select("*")
     .order("id", { ascending: true });
   ```
3. **Render**: Kategoriler kart şeklinde listelenir
4. **Link**: Her kategori `/category/${category.id}` sayfasına yönlendirir

---

## 🎨 UI/UX Mimari

### Layout System

- **Root Layout** (`app/layout.tsx`):
  - Geist Sans + Geist Mono fontları
  - Full-height body layout
  - Antialiased rendering
  - Meta: title, description

### Styling Yaklaşımı

- **Tailwind CSS 4** utility-first approach
- **Color Palette**: Gray gradient backgrounds, blue accent
- **Responsive**: Mobile-first (sm:, lg: breakpoints)
- **Animations**: Hover transitions, transform effects

### Component Patterns

```typescript
// Server Component (default)
export default async function HomePage() {
  const data = await fetchData(); // Server-side
  return <UI data={data} />;
}
```

---

## 🔐 Environment Variables

```bash
# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # Sadece seed için
```

---

## 📦 Bağımlılıklar

### Production Dependencies

```json
{
  "@supabase/supabase-js": "^2.107.0",
  "next": "16.2.7",
  "react": "19.2.4",
  "react-dom": "19.2.4"
}
```

### Dev Dependencies

```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.2.7",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## 🚀 Önemli Özellikler

### 1. Next.js 16 App Router

- **Server Components**: Varsayılan olarak server-side render
- **Revalidation**: `export const revalidate = 0` ile ISR devre dışı
- **API Routes**: `app/api/*/route.ts` pattern'i
- **TypeScript**: Native type support

### 2. Supabase Integration

- **Singleton Client**: `lib/supabase.ts` merkezi client
- **Row Level Security (RLS)**: Varsayılan olarak public read access
- **Batch Operations**: 1000'lik parçalarla upsert
- **Error Handling**: Try-catch + response error checking

### 3. Data Cleaning Strategy

```typescript
// JSON dosyalarındaki satır atlamalarını temizler
const cleanedText = rawText.replace(/\r?\n|\r/g, " ");
// "IPHONE 12\nPRO" → "IPHONE 12 PRO"
```

### 4. Deduplication

```typescript
// ID bazlı tekilleştirme
const uniqueProductsMap = new Map();
allProductsArray.forEach((p) => {
  if (p.id) uniqueProductsMap.set(p.id, p);
});
```

---

## 🎯 Routing Yapısı

### Mevcut Routes

- `/` - Ana sayfa (kategori listesi)
- `/api/seed` - Seed endpoint

### Planlanan/Beklenen Routes

- `/category/[id]` - Kategori detay sayfası (ürünler)
- `/product/[id]` - Ürün detay sayfası (uyumlu modeller)
- `/search` - Arama sayfası

---

## 🔧 TypeScript Konfigürasyonu

```json
{
  "target": "ES2017",
  "lib": ["dom", "dom.iterable", "esnext"],
  "jsx": "react-jsx",
  "strict": true,
  "moduleResolution": "bundler",
  "paths": {
    "@/*": ["./*"] // Alias import pattern
  }
}
```

**Import Pattern:**

```typescript
import { supabase } from "@/lib/supabase"; // ✅ @/ = root
import Link from "next/link"; // ✅ Next.js components
```

---

## 📊 Performans Stratejileri

### Server-Side Rendering (SSR)

- Her sayfa render'ında fresh data
- `revalidate = 0` ile cache bypass
- Supabase'den direkt server-side fetch

### Future Optimizations

- [ ] ISR (Incremental Static Regeneration) ile cache
- [ ] Search için client-side filtering
- [ ] Image optimization (next/image)
- [ ] Code splitting (dynamic imports)

---

## 🌐 Deployment

### Vercel (Önerilen)

```bash
# Auto-deploy on git push
git push origin main
```

**Environment Variables Gerekli:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔍 Önemli Notlar

1. **Next.js 16 Breaking Changes**: Bu versiyon eğitim datasından farklı olabilir. `node_modules/next/dist/docs/` klasöründeki dökümanları kontrol et.

2. **Data Files**: `/data/*.json` dosyaları satır atlamaları içerebilir. Seed route bunları temizler.

3. **Batch Insert**: `product_models` için 1000'lik batch kullanılıyor (performance).

4. **Upsert Strategy**: `{ onConflict: "id" }` ile ID çakışmalarında update yapar.

5. **Font Loading**: Google Fonts (Geist) `next/font/google` ile optimize edilmiş şekilde yükleniyor.

---

## 📝 Geliştirme Komutları

```bash
# Development server
npm run dev

# Production build
npm run build

# Production server
npm run start

# Linting
npm run lint

# Database seed
# Tarayıcıda: http://localhost:3000/api/seed
```

---

## 🎨 Renk Paleti

```css
/* Primary Colors */
--blue-accent: #007bff; /* Kategori kartları, hover */
--blue-50: #eff6ff; /* Icon background */
--blue-600: #2563eb; /* Icon hover */

/* Neutral Colors */
--gray-50: #f9fafb; /* Background */
--gray-100: #f3f4f6; /* Card borders */
--gray-400: #9ca3af; /* Secondary text */
--gray-600: #4b5563; /* Body text */
--gray-800: #1f2937; /* Headings */
--gray-900: #111827; /* Primary text */

/* Semantic Colors */
--red-50: #fef2f2; /* Error background */
--red-500: #ef4444; /* Error text */
--red-600: #dc2626; /* Error primary */
```

---

## 📚 İlgili Dosyalar Referansı

| Dosya                   | Amaç         | Bağımlılıklar         |
| ----------------------- | ------------ | --------------------- |
| `app/page.tsx`          | Ana sayfa UI | Supabase, Next/Link   |
| `app/layout.tsx`        | Root layout  | next/font/google      |
| `lib/supabase.ts`       | DB Client    | @supabase/supabase-js |
| `app/api/seed/route.ts` | Data import  | fs, path, Supabase    |
| `data/*.json`           | Seed data    | -                     |

---

**Son Güncelleme**: 8 Haziran 2026
**Versiyon**: 1.0.0
**Dil**: TypeScript + React 19 + Next.js 16
