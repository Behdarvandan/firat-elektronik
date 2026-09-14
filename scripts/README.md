# 🌱 Veri Göçü (Seed) Scripti

Bu script, JSON dosyalarındaki verileri Supabase veritabanına yükler.

## 📋 Gereksinimler

1. **Bağımlılıkları Kurun:**

   ```bash
   npm install ts-node --save-dev
   ```

   > **Not:** `typescript` ve `@types/node` zaten devDependencies'de mevcut.

2. **.env.local Dosyası:**
   Projenizin kök dizininde `.env.local` dosyasının olduğundan ve şu değişkenleri içerdiğinden emin olun:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🗄️ Veritabanı Yapısı

Script şu tabloları kullanır:

### `categories` Tablosu

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  prefix TEXT
);
```

### `products` Tablosu

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  box_code TEXT,
  category_id INTEGER REFERENCES categories(id)
);
```

### `product_models` Tablosu

```sql
CREATE TABLE product_models (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  sort_order INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT false
);
```

## 🚀 Kullanım

### Adım 1: Bağımlılıkları Kurun

```bash
npm install ts-node --save-dev
```

### Adım 2: Seed Scriptini Çalıştırın

```bash
npm run seed
```

**VEYA** doğrudan:

```bash
npx ts-node scripts/seed.ts
```

## 📂 Veri Kaynakları

Script aşağıdaki JSON dosyalarını okur:

- `data/homepage.json` → Kategori verileri
- `data/samsung.json` → Samsung ürünleri
- `data/apple.json` → Apple ürünleri
- `data/xiaomi.json` → Xiaomi ürünleri
- `data/oppo.json` → Oppo ürünleri
- `data/huwai.json` → Huawei ürünleri

## ⚙️ Script İşleyişi

1. **Kategoriler:** `homepage.json` dosyasından kategoriler okunur ve `categories` tablosuna eklenir
2. **Ürünler:** Her ürün dosyasından ürünler okunur ve `products` tablosuna eklenir
3. **Modeller:** Her ürünün modelleri (mobiles) `product_models` tablosuna eklenir

## 🔄 Mükerrer Veri Yönetimi

Script **`upsert`** metodunu kullanır:

- Aynı ID'ye sahip kayıt varsa → Günceller
- Aynı ID'ye sahip kayıt yoksa → Ekler

Bu sayede scripti birden fazla çalıştırabilirsiniz, hata vermez.

## 📊 Örnek Çıktı

```
🚀 Veri göçü (seed) başlatılıyor...

==================================================

🏷️  Kategoriler yükleniyor...
✅ 4 kategori başarıyla yüklendi!

📦 Ürünler yükleniyor...

  📄 samsung.json işleniyor...
  ℹ️  15 ürün bulundu
  ✅ samsung.json tamamlandı!

  📄 apple.json işleniyor...
  ℹ️  25 ürün bulundu
  ✅ apple.json tamamlandı!

✅ Toplam 250 ürün yüklendi!
✅ Toplam 5000 model yüklendi!

==================================================
🎉 Veri göçü başarıyla tamamlandı!
==================================================
```

## 🛠️ Sorun Giderme

### Hata: "Cannot find module 'ts-node'"

**Çözüm:**

```bash
npm install ts-node --save-dev
```

### Hata: "Supabase URL veya ANON KEY bulunamadı"

**Çözüm:**

- `.env.local` dosyasının varlığını kontrol edin
- Değişken isimlerinin doğru olduğundan emin olun

### Hata: "Dosya okuma hatası"

**Çözüm:**

- `data/` klasörünün var olduğundan emin olun
- JSON dosyalarının doğru formatta olduğunu kontrol edin

## 🔐 Güvenlik Notu

- Script sadece geliştirme ortamında çalıştırılmalıdır
- Production veritabanında kullanmadan önce yedeğinizi alın
- `ANON_KEY` kullanıldığı için RLS (Row Level Security) politikalarınızı kontrol edin

## 📝 Notlar

- Script izole olarak çalışır, mevcut kodlara zarar vermez
- Tüm işlemler loglama ile takip edilir
- Hata durumunda detaylı mesajlar verir
- Her dosya ayrı ayrı işlenir, bir hata diğerlerini etkilemez
