// ============================================================================
// Excel (xlsx) Ayrıştırma & Doğrulama Katmanı — Admin "Excel Import" modülü
//
// Bu modül SAF fonksiyonlardan oluşur: DB'ye dokunmaz. Gelen Buffer'ı SheetJS
// ile okur, başlık satırlarını eşleştirir, satırları normalize edip doğrular ve
// `products` / `product_models` için hazır satırlar üretir. Böylece ayrıştırma
// mantığı test edilebilir ve sunucu aksiyonundan bağımsızdır.
//
// ⚠️  YALNIZCA SUNUCUDA İMPORT EDİN — SheetJS'i istemci bundle'ına sokmayın.
// ============================================================================

import * as XLSX from "xlsx";

// ----------------------------------------------------------------------------
// Tipler — Supabase şemasıyla birebir (bkz. ARCHITECTURE.md)
// ----------------------------------------------------------------------------

/** `products` tablosuna yazılacak satır (id: integer, category_id: integer) */
export interface ImportedProduct {
  id: number;
  name: string;
  box_code: string | null;
  category_id: number | null;
  box_code_note?: string | null;
  capacity?: string | null;
  product_code?: string | null;
  description?: string | null;
}

/** `product_models` tablosuna yazılacak satır (id: string, ör. "16_0") */
export interface ImportedModel {
  id: string;
  product_id: number;
  model_name: string;
  sort_order: number;
  is_new: boolean;
  description?: string | null;
}

/** Ayrıştırma sonucu: satırlar + satır bazlı hata/uyarı listeleri */
export interface ParsedWorkbook {
  products: ImportedProduct[];
  models: ImportedModel[];
  errors: string[]; // kritik doğrulama hataları (o satır atlandı)
  warnings: string[]; // engelleyici olmayan durumlar
}

// Hata/uyarı listelerinin şişmesini önlemek için üst sınır
const MAX_MESSAGES = 100;

// ----------------------------------------------------------------------------
// Başlık (header) normalizasyonu ve sütun eşleştirme
// ----------------------------------------------------------------------------

/**
 * Başlık metnini karşılaştırılabilir forma çevirir:
 * küçük harf + Türkçe karakter sadeleştirme + boşluk/_/-/. kaldırma.
 * Örn: "Box Code" / "box_code" / "Kutu Kodu" → "boxcode" / "kutukodu"
 */
function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[\s_\-./]+/g, "");
}

/** Alan adı -> o alanı temsil edebilecek normalize edilmiş başlık adayları */
type FieldAliases = Record<string, string[]>;

// Ürün sütunları. "id" burada ÜRÜN kimliğini ifade eder.
const PRODUCT_ALIASES: FieldAliases = {
  id: ["id"],
  name: ["name", "ad", "productname", "urunadi", "urunad", "isim"],
  box_code: ["boxcode", "kutukodu", "kutukod", "box", "boxkodu"],
  category_id: ["categoryid", "kategoriid", "category", "kategori"],
  box_code_note: ["boxcodenote", "kutukodunotu"],
  capacity: ["capacity", "kapasite"],
  product_code: ["productcode", "urunkodu", "urunkod"],
  description: ["description", "aciklama", "not"],
};

// Model sütunları. "id"/"mid" burada MODEL kimliğini ifade eder.
const MODEL_ALIASES: FieldAliases = {
  id: ["id", "mid", "modelid"],
  model_name: ["modelname", "model", "modeladi", "modelad"],
  product_id: ["productid", "urunid", "product", "urun"],
  sort_order: ["sortorder", "sort", "sira", "siralama"],
  is_new: ["isnew", "yeni", "new", "yenimodel"],
  description: ["description", "aciklama", "not"],
};

// Tek-sayfa (flat) formatta "id" ürün kimliğidir; model kimliği bu sütunlardan gelir.
const FLAT_MODEL_ID_ALIASES = ["mid", "modelid"];

// Sayfa adları (normalize edilmiş) — hangi sayfanın ürün/model içerdiğini tanır.
const PRODUCT_SHEET_NAMES = ["products", "urunler", "urunlar", "product", "urun"];
const MODEL_SHEET_NAMES = ["models", "modeller", "productmodels", "model", "urunmodelleri"];

// ----------------------------------------------------------------------------
// Değer dönüştürücüler
// ----------------------------------------------------------------------------

/** Hücreyi boş/boşluk içermeyen string'e çevirir; yoksa null döner. */
function cellToString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/** Hücreyi tam sayıya çevirir; geçersizse null döner. */
function cellToInt(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") {
    return Number.isFinite(v) && Number.isInteger(v) ? v : null;
  }
  // "1.000" gibi binlik ayraçlarını ve olası kirli karakterleri temizle
  const cleaned = String(v).trim().replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && Number.isInteger(n) ? n : null;
}

/** Hücreyi boolean'a çevirir (true/1/yes/evet vs. → true, aksi false). */
function cellToBool(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toLowerCase();
  return ["true", "1", "yes", "evet", "y", "x", "✓", "ok", "yeni"].includes(s);
}

/** Satırdan, verilen sütun indeksindeki değeri güvenle alır. */
function pick(row: unknown[], colIndex: number | undefined): unknown {
  return colIndex != null ? row[colIndex] : null;
}

// ----------------------------------------------------------------------------
// Sütun eşleştirme yardımcıları
// ----------------------------------------------------------------------------

/**
 * Başlık satırını alıp, her alan için sütun indeksini çözer.
 * Dönüş: { alanAdi: sütunIndeksi } — bulunamayan alanlar yok sayılır.
 */
function mapColumns(
  headers: string[],
  aliases: FieldAliases,
): Record<string, number> {
  const normalized = headers.map((h) => (h == null ? "" : normalizeHeader(String(h))));
  const result: Record<string, number> = {};
  for (const [field, names] of Object.entries(aliases)) {
    const idx = normalized.findIndex((nh) => nh !== "" && names.includes(nh));
    if (idx !== -1) result[field] = idx;
  }
  return result;
}

/** İlk non-empty satırı başlık kabul edip, gerisini veri satırı olarak ayırır. */
function splitHeaderData(
  rows: unknown[][],
): { headers: string[]; dataRows: unknown[][] } | null {
  const headerIdx = rows.findIndex(
    (r) => Array.isArray(r) && r.some((c) => c != null && String(c).trim() !== ""),
  );
  if (headerIdx === -1) return null;

  const headers = rows[headerIdx].map((c) => (c == null ? "" : String(c)));
  return { headers, dataRows: rows.slice(headerIdx + 1) };
}

/** Boş (hiç değer içermeyen) satırı tespit eder. */
function isBlankRow(row: unknown[]): boolean {
  return !row.some((c) => c != null && String(c).trim() !== "");
}

// ----------------------------------------------------------------------------
// Satır ayrıştırıcıları
// ----------------------------------------------------------------------------

/** Bir ürün satırını doğrular ve normalize eder; geçersizse null + hata kaydeder. */
function parseProductRow(
  row: unknown[],
  cols: Record<string, number>,
  rowNum: number,
  errors: string[],
): ImportedProduct | null {
  const id = cellToInt(pick(row, cols.id));
  const name = cellToString(pick(row, cols.name));
  const category_id = cellToInt(pick(row, cols.category_id));

  // id + name zorunlu. category_id de bu katalogda her ürünün kategorisi olduğu
  // için zorunlu tutulur (FK bütünlüğü — aksi halde toplu upsert patlar).
  if (id == null || id <= 0) {
    errors.push(`Ürünler — Satır ${rowNum}: geçerli bir 'id' bulunamadı, atlandı.`);
    return null;
  }
  if (!name) {
    errors.push(`Ürünler — Satır ${rowNum}: 'name' boş, atlandı.`);
    return null;
  }
  if (category_id == null) {
    errors.push(`Ürünler — Satır ${rowNum}: 'category_id' bulunamadı, atlandı (${name}).`);
    return null;
  }

  const product: ImportedProduct = {
    id,
    name,
    box_code: cellToString(pick(row, cols.box_code)),
    category_id,
  };

  // Opsiyonel alanlar — yalnızca doluysa ekle (boş sütun göndermeyelim)
  const box_code_note = cellToString(pick(row, cols.box_code_note));
  if (box_code_note) product.box_code_note = box_code_note;
  const capacity = cellToString(pick(row, cols.capacity));
  if (capacity) product.capacity = capacity;
  const product_code = cellToString(pick(row, cols.product_code));
  if (product_code) product.product_code = product_code;
  const description = cellToString(pick(row, cols.description));
  if (description) product.description = description;

  return product;
}

/** Bir model satırını doğrular ve normalize eder; geçersizse null + hata kaydeder. */
function parseModelRow(
  row: unknown[],
  cols: Record<string, number>,
  rowNum: number,
  errors: string[],
  generatedId?: string,
): ImportedModel | null {
  const model_name = cellToString(pick(row, cols.model_name));
  const product_id = cellToInt(pick(row, cols.product_id));

  if (!model_name) {
    errors.push(`Modeller — Satır ${rowNum}: 'model_name' boş, atlandı.`);
    return null;
  }
  if (product_id == null) {
    errors.push(`Modeller — Satır ${rowNum}: 'product_id' bulunamadı, atlandı (${model_name}).`);
    return null;
  }

  const rawId = cellToString(pick(row, cols.id)) ?? generatedId;
  if (!rawId) {
    errors.push(`Modeller — Satır ${rowNum}: 'id' bulunamadı, atlandı (${model_name}).`);
    return null;
  }

  const model: ImportedModel = {
    id: rawId,
    product_id,
    model_name,
    sort_order: cellToInt(pick(row, cols.sort_order)) ?? 0,
    is_new: cellToBool(pick(row, cols.is_new)),
  };

  const description = cellToString(pick(row, cols.description));
  if (description) model.description = description;

  return model;
}

// ----------------------------------------------------------------------------
// Sayfa (sheet) türüne göre ayrıştırma
// ----------------------------------------------------------------------------

/** "products" benzeri sayfa: her satır bir ürün. */
function parseProductsSheet(rows: unknown[][], errors: string[]): ImportedProduct[] {
  const split = splitHeaderData(rows);
  if (!split) return [];

  const cols = mapColumns(split.headers, PRODUCT_ALIASES);
  if (cols.id == null || cols.name == null) return [];

  const products: ImportedProduct[] = [];
  split.dataRows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const parsed = parseProductRow(row, cols, i + 2, errors); // +2: başlık + 1-index
    if (parsed) products.push(parsed);
  });
  return products;
}

/** "models" benzeri sayfa: her satır bir model. */
function parseModelsSheet(rows: unknown[][], errors: string[]): ImportedModel[] {
  const split = splitHeaderData(rows);
  if (!split) return [];

  const cols = mapColumns(split.headers, MODEL_ALIASES);
  if (cols.model_name == null || cols.product_id == null) return [];

  const models: ImportedModel[] = [];
  split.dataRows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const parsed = parseModelRow(row, cols, i + 2, errors);
    if (parsed) models.push(parsed);
  });
  return models;
}

/**
 * Tek-sayfa (flat) format: aynı sayfada hem ürün hem model sütunları bulunur.
 * Her satır bir MODEL'dir; ürün bilgisi (id/name/box_code/category_id) satırda
 * tekrarlanır. Aynı ürün id'sine sahip satırlar tek bir ürüne indirgenir.
 */
function parseFlatSheet(
  rows: unknown[][],
  errors: string[],
  warnings: string[],
): { products: ImportedProduct[]; models: ImportedModel[] } {
  const split = splitHeaderData(rows);
  if (!split) return { products: [], models: [] };

  // Flat modda "id" ürün kimliğini; "mid"/"modelid" model kimliğini temsil eder.
  const productCols = mapColumns(split.headers, PRODUCT_ALIASES);
  const flatModelAliases: FieldAliases = {
    ...MODEL_ALIASES,
    id: FLAT_MODEL_ID_ALIASES, // "id" başlığı model id'si olarak yorumlanmasın
  };
  const modelCols = mapColumns(split.headers, flatModelAliases);

  // Flat modda modelin bağlı olduğu ürün, "id" sütunundan gelir (ayrı bir
  // "product_id" sütunu yoksa). Açık "product_id" varsa o tercih edilir.
  if (modelCols.product_id == null && productCols.id != null) {
    modelCols.product_id = productCols.id;
  }

  if (productCols.name == null || modelCols.model_name == null) {
    warnings.push(
      "Flat sayfa algılandı ancak ürün 'name' ve model 'model_name' sütunları birlikte bulunamadı; sayfa atlandı.",
    );
    return { products: [], models: [] };
  }

  const productsById = new Map<number, ImportedProduct>();
  const models: ImportedModel[] = [];
  // Aynı ürüne ait modeller için sayaç: "16_0", "16_1" ... (id yoksa otomatik üret)
  const modelCounters = new Map<number, number>();

  split.dataRows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const rowNum = i + 2;

    const product = parseProductRow(row, productCols, rowNum, errors);
    if (!product) return;

    const existing = productsById.get(product.id);
    if (existing) {
      if (!existing.box_code && product.box_code) existing.box_code = product.box_code;
    } else {
      productsById.set(product.id, product);
    }

    const counter = modelCounters.get(product.id) ?? 0;
    modelCounters.set(product.id, counter + 1);
    const generatedId = `${product.id}_${counter}`;

    const model = parseModelRow(row, modelCols, rowNum, errors, generatedId);
    if (model) models.push(model);
  });

  return { products: Array.from(productsById.values()), models };
}

// ----------------------------------------------------------------------------
// Ana giriş noktası
// ----------------------------------------------------------------------------

/**
 * Excel Buffer'ını okuyup ürün/model satırlarına ayrıştırır.
 *
 * Desteklenen formatlar:
 *  1) Çok sayfalı: "products"/"Ürünler" + "models"/"Modeller" sayfaları.
 *  2) Tek sayfalı (flat): ürün + model sütunları aynı sayfada.
 * Sayfa adı tanınmıyorsa sütun içeriklerine göre otomatik tespit yapılır.
 *
 * @param buffer Excel dosyasının ham baytları (Buffer)
 */
export function parseWorkbook(buffer: Buffer): ParsedWorkbook {
  const errors: string[] = [];
  const warnings: string[] = [];

  // SheetJS ile çalışma kitabını oku (hem .xlsx hem .xls destekler)
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const products: ImportedProduct[] = [];
  const models: ImportedModel[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    // header:1 → her satırı düz dizi olarak al; defval:null → boş hücre null
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      blankrows: false,
    }) as unknown[][];

    if (!rows.length) continue;

    const normalizedSheet = normalizeHeader(sheetName);

    if (PRODUCT_SHEET_NAMES.includes(normalizedSheet)) {
      products.push(...parseProductsSheet(rows, errors));
      continue;
    }
    if (MODEL_SHEET_NAMES.includes(normalizedSheet)) {
      models.push(...parseModelsSheet(rows, errors));
      continue;
    }

    // Tanınmayan sayfa adı → sütun içeriğine göre tespit et
    const split = splitHeaderData(rows);
    if (!split) continue;
    const headerSet = split.headers.map((h) => normalizeHeader(h)).filter((h) => h !== "");
    const hasProductName = headerSet.some((h) => (PRODUCT_ALIASES.name ?? []).includes(h));
    const hasModelName = headerSet.some((h) => (MODEL_ALIASES.model_name ?? []).includes(h));

    if (hasProductName && hasModelName) {
      const flat = parseFlatSheet(rows, errors, warnings);
      products.push(...flat.products);
      models.push(...flat.models);
    } else if (hasProductName) {
      products.push(...parseProductsSheet(rows, errors));
    } else if (hasModelName) {
      models.push(...parseModelsSheet(rows, errors));
    } else {
      warnings.push(`"${sheetName}" sayfası tanınmadı ve atlandı.`);
    }
  }

  return {
    products: dedupeProducts(products),
    models: dedupeModels(models),
    errors: capMessages(errors),
    warnings: capMessages(warnings),
  };
}

// ----------------------------------------------------------------------------
// Tekilleştirme & mesaj sınırlama
// ----------------------------------------------------------------------------

/** Aynı id'ye sahip ürünleri tekilleştir (son kayıt kazanır). */
function dedupeProducts(list: ImportedProduct[]): ImportedProduct[] {
  const map = new Map<number, ImportedProduct>();
  for (const p of list) map.set(p.id, p);
  return Array.from(map.values());
}

/** Aynı id'ye sahip modelleri tekilleştir (son kayıt kazanır). */
function dedupeModels(list: ImportedModel[]): ImportedModel[] {
  const map = new Map<string, ImportedModel>();
  for (const m of list) map.set(m.id, m);
  return Array.from(map.values());
}

/** Mesaj listesini üst sınırda keser (dev veri kümelerinde yanıt şişmesin). */
function capMessages(list: string[]): string[] {
  if (list.length <= MAX_MESSAGES) return list;
  const capped = list.slice(0, MAX_MESSAGES);
  capped.push(`... ve ${list.length - MAX_MESSAGES} kayıt daha.`);
  return capped;
}



