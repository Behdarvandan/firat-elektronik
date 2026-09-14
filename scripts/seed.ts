import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Supabase Şema Tipleri (Database tablolarınızla birebir eşleşmeli)
// ============================================================================

interface Database {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: CategoryRow;
      };
      products: {
        Row: ProductRow;
        Insert: ProductRow;
      };
      product_models: {
        Row: ProductModelRow;
        Insert: ProductModelRow;
      };
    };
  };
}

interface CategoryRow {
  id: number;
  name: string;
  prefix: string;
}

interface ProductRow {
  id: number;
  name: string;
  box_code: string;
  category_id: number;
}

interface ProductModelRow {
  id: number;
  model_name: string;
  product_id: number;
  sort_order: number;
  is_new: boolean;
}

// ============================================================================
// JSON Kaynak Dosyalarının Tipleri (homepage.json, samsung.json, vb.)
// ============================================================================

interface HomepageCategoryJSON {
  id: number;
  name: string;
  prefix?: string;
}

interface HomepageJSON {
  categories: HomepageCategoryJSON[];
}

interface MobileJSON {
  mid: number;
  model: string;
  sort?: number;
  isNew?: boolean;
}

interface ProductJSON {
  id: number;
  name: string;
  boxCode: string;
  categoryId: number;
  mobiles?: MobileJSON[];
}

interface ProductFileJSON {
  products: ProductJSON[];
}

// ============================================================================
// Setup
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.",
  );
  process.exit(1);
}

const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
);

const DATA_DIR = path.join(process.cwd(), "data");

// ============================================================================
// Yardımcı Fonksiyonlar
// ============================================================================

/**
 * JSON dosyasını okur ve verilen tipe göre parse eder.
 * Dosya okunamazsa veya parse edilemezse null döner.
 */
function readJSONFile<T>(filename: string): T | null {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`❌ Dosya okuma hatası (${filename}):`, error);
    return null;
  }
}

// ============================================================================
// Kategorileri veritabanına yükleme
// ============================================================================

async function seedCategories(): Promise<boolean> {
  console.log("\n🏷️  Kategoriler yükleniyor...");

  const homepageData = readJSONFile<HomepageJSON>("homepage.json");
  if (!homepageData?.categories) {
    console.error("❌ homepage.json dosyasında categories bulunamadı!");
    return false;
  }

  const categories: CategoryRow[] = homepageData.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    prefix: cat.prefix || `CAT${cat.id}`,
  }));

  const { error } = await supabase
    .from("categories")
    .upsert(categories as never, { onConflict: "id" });

  if (error) {
    console.error("❌ Kategori yükleme hatası:", error);
    return false;
  }

  console.log(`✅ ${categories.length} kategori başarıyla yüklendi!`);
  return true;
}

// ============================================================================
// Tek bir ürün dosyasını okuyup ürün/model satırlarına dönüştürme
// (Saf fonksiyon — DB'ye dokunmaz, sadece veri hazırlar. Bu da test edilebilirliği
// ve paralel işlemeyi kolaylaştırır.)
// ============================================================================

interface ParsedFileResult {
  filename: string;
  products: ProductRow[];
  models: ProductModelRow[];
}

function parseProductFile(filename: string): ParsedFileResult | null {
  const fileData = readJSONFile<ProductFileJSON>(filename);
  if (!fileData?.products) {
    console.error(`  ⚠️  ${filename} dosyasında products bulunamadı!`);
    return null;
  }

  const products: ProductRow[] = [];
  const models: ProductModelRow[] = [];

  for (const product of fileData.products) {
    products.push({
      id: product.id,
      name: product.name,
      box_code: product.boxCode,
      category_id: product.categoryId,
    });

    if (product.mobiles?.length) {
      for (const mobile of product.mobiles) {
        models.push({
          id: mobile.mid,
          model_name: mobile.model,
          product_id: product.id,
          sort_order: mobile.sort ?? 0,
          is_new: mobile.isNew ?? false,
        });
      }
    }
  }

  return { filename, products, models };
}

// ============================================================================
// Ürünleri ve modellerini veritabanına yükleme
// ============================================================================

const PRODUCT_FILES = [
  "samsung.json",
  "apple.json",
  "xiaomi.json",
  "oppo.json",
  "huwai.json",
] as const;

// Supabase/PostgREST tek istekte makul büyüklükte payload kabul eder;
// çok büyük JSON dosyalarında bellek/timeout riskini azaltmak için parça parça gönderiyoruz.
const BATCH_SIZE = 500;

async function upsertInBatches<T extends { id: number }>(
  table: "products" | "product_models",
  rows: T[],
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(batch as never, { onConflict: "id" });

    if (error) {
      console.error(
        `  ❌ ${table} batch yükleme hatası (satır ${i}-${i + batch.length}):`,
        error,
      );
      failed += batch.length;
    } else {
      success += batch.length;
    }
  }

  return { success, failed };
}

async function seedProducts(): Promise<boolean> {
  console.log("\n📦 Ürünler yükleniyor...");

  // Dosyalar birbirinden bağımsız — paralel oku/parse et (DB'ye henüz dokunmuyoruz)
  const parsedFiles = PRODUCT_FILES.map((filename) => {
    console.log(`  📄 ${filename} okunuyor...`);
    return parseProductFile(filename);
  }).filter((result): result is ParsedFileResult => result !== null);

  const allProducts = parsedFiles.flatMap((f) => f.products);
  const allModels = parsedFiles.flatMap((f) => f.models);

  console.log(
    `\n  ℹ️  Toplam ${allProducts.length} ürün, ${allModels.length} model bulundu. Yükleniyor...`,
  );

  // Önce tüm ürünler (FK bütünlüğü için modellerden önce olmalı)
  const productResult = await upsertInBatches("products", allProducts);
  console.log(
    `  ✅ Ürünler: ${productResult.success} başarılı, ${productResult.failed} başarısız`,
  );

  // Sonra modeller
  const modelResult = await upsertInBatches("product_models", allModels);
  console.log(
    `  ✅ Modeller: ${modelResult.success} başarılı, ${modelResult.failed} başarısız`,
  );

  console.log(`\n✅ Toplam ${productResult.success} ürün yüklendi!`);
  console.log(`✅ Toplam ${modelResult.success} model yüklendi!`);

  return productResult.failed === 0 && modelResult.failed === 0;
}

// ============================================================================
// Ana seed fonksiyonu
// ============================================================================

async function main(): Promise<void> {
  console.log("🚀 Veri göçü (seed) başlatılıyor...\n");
  console.log("=".repeat(50));

  try {
    const categoriesSuccess = await seedCategories();
    if (!categoriesSuccess) {
      console.error("\n❌ Kategoriler yüklenemedi, işlem durduruluyor.");
      process.exit(1);
    }

    const productsSuccess = await seedProducts();
    if (!productsSuccess) {
      console.error(
        "\n⚠️  Bazı ürünler/modeller yüklenemedi (yukarıdaki loglara bakın).",
      );
      process.exit(1);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Veri göçü başarıyla tamamlandı!");
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n💥 Beklenmeyen hata:", error);
    process.exit(1);
  }
}

main();
