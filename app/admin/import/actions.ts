"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseWorkbook } from "@/lib/excel-import";

// Toplu yazma için tek istekte gönderilecek maksimum satır (seed ile aynı).
const BATCH_SIZE = 500;
// next.config.ts'teki serverActions.bodySizeLimit (10mb) ile uyumlu dosya sınırı.
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

/** İstemciye dönen sonuç tipi (Server Action → serileştirilebilir olmalı). */
export interface ImportResult {
  success: boolean;
  error?: string;
  productsInserted?: number;
  modelsInserted?: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * Admin oturum kontrolü — proxy.ts /admin'i zaten korur; burada da savunma
 * derinliği (defense in depth) için tekrar doğrulanır.
 */
async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get("admin_session")?.value)) {
    throw new Error("Yetkisiz erişim. Admin girişi gerekli.");
  }
}

/**
 * Excel dosyasını alır, ayrıştırır ve products / product_models tablolarına
 * toplu (batch) upsert ile işler.
 *
 * GÜVENLİK NOTU: organization_id benzeri sahiplik bilgileri istemciden DEĞİL,
 * doğrulanmış oturumdan gelir. Dosya içeriği sunucuda ayrıştırılır ve satırlar
 * doğrulanır; istemci yalnızca ham File gönderir.
 */
export async function importExcelAction(
  formData: FormData,
): Promise<ImportResult> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return {
        success: false,
        error: "Dosya bulunamadı. Lütfen bir .xlsx dosyası seçin.",
      };
    }
    if (file.size === 0) {
      return { success: false, error: "Dosya boş." };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Dosya 10MB sınırını aşıyor." };
    }
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        success: false,
        error: "Geçersiz dosya türü. Lütfen .xlsx veya .xls yükleyin.",
      };
    }

    // File → Buffer (SheetJS buffer olarak okur)
    const buffer = Buffer.from(await file.arrayBuffer());

    // Excel'i ayrıştır (saf fonksiyon — DB'ye dokunmaz)
    const parsed = parseWorkbook(buffer);

    if (parsed.products.length === 0 && parsed.models.length === 0) {
      return {
        success: false,
        error:
          "Ayrıştırılabilir satır bulunamadı. Başlık/sütun adlarını kontrol edin.",
        errors: parsed.errors,
        warnings: parsed.warnings,
      };
    }

    let productsInserted = 0;
    let modelsInserted = 0;

    // 1) Ürünleri önce yaz (FK bütünlüğü için modellerden önce)
    for (const batch of chunk(parsed.products, BATCH_SIZE)) {
      const { error } = await supabaseAdmin
        .from("products")
        .upsert(batch, { onConflict: "id" });
      if (error) {
        return {
          success: false,
          error: `Ürün yükleme hatası: ${error.message}`,
          errors: parsed.errors,
          warnings: parsed.warnings,
        };
      }
      productsInserted += batch.length;
    }

    // 2) Modelleri yaz
    for (const batch of chunk(parsed.models, BATCH_SIZE)) {
      const { error } = await supabaseAdmin
        .from("product_models")
        .upsert(batch, { onConflict: "id" });
      if (error) {
        return {
          success: false,
          error: `Model yükleme hatası: ${error.message}`,
          errors: parsed.errors,
          warnings: parsed.warnings,
        };
      }
      modelsInserted += batch.length;
    }

    // İlgili sayfaların cache'ini tazele
    revalidatePath("/admin/products");
    revalidatePath("/admin/models");
    revalidatePath("/");

    return {
      success: true,
      productsInserted,
      modelsInserted,
      errors: parsed.errors,
      warnings: parsed.warnings,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}

/** Diziyi sabit boyutlu parçalara böler. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
