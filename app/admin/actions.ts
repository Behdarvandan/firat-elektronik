"use server";

import { supabaseAdmin } from "@/lib/supabase-admin"; // Admin client kullan (RLS bypass)
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/admin-session";

/**
 * Admin oturum kontrolü - Tüm admin işlemlerinden önce çağrılmalı
 * Cookie'deki admin_session token'ının imzasını ve süresini doğrular
 */
async function checkAdminSession() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!verifySessionToken(adminSession?.value)) {
    throw new Error("Yetkisiz erişim. Admin girişi gerekli.");
  }
}

/**
 * Yeni ürün ekleme fonksiyonu
 * @param productData - Eklenecek ürün verileri
 */
export async function addProduct(productData: any) {
  await checkAdminSession(); // Güvenlik: Admin oturum kontrolü

  try {
    console.log("addProduct çağrıldı:", productData);

    const { data, error } = await supabaseAdmin // Admin client (RLS bypass)
      .from("products")
      .insert([productData])
      .select();

    if (error) throw error;

    // Cache'i temizle
    revalidatePath("/admin/products");

    return { success: true, message: "Ürün başarıyla eklendi", data };
  } catch (error) {
    console.error("addProduct hatası:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Mevcut ürünü güncelleme fonksiyonu
 * @param productId - Güncellenecek ürünün ID'si
 * @param productData - Güncellenecek ürün verileri
 */
export async function updateProduct(productId: string, productData: any) {
  await checkAdminSession(); // Güvenlik: Admin oturum kontrolü

  try {
    console.log("updateProduct çağrıldı:", { productId, productData });

    const { data, error } = await supabaseAdmin // Admin client (RLS bypass)
      .from("products")
      .update(productData)
      .eq("id", productId)
      .select();

    if (error) throw error;

    // Cache'i temizle
    revalidatePath("/admin/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      message: "Ürün başarıyla güncellendi",
      data,
    };
  } catch (error) {
    console.error("updateProduct hatası:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Ürün silme fonksiyonu
 * @param productId - Silinecek ürünün ID'si
 */
export async function deleteProduct(productId: string) {
  await checkAdminSession(); // Güvenlik: Admin oturum kontrolü

  try {
    console.log("deleteProduct çağrıldı:", productId);

    const { error } = await supabaseAdmin // Admin client (RLS bypass)
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    // Cache'i temizle
    revalidatePath("/admin/products");

    return { success: true, message: "Ürün başarıyla silindi" };
  } catch (error) {
    console.error("deleteProduct hatası:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}

// =====================================================
// KATEGORİ CRUD FONKSİYONLARI
// =====================================================

/**
 * Yeni kategori ekleme fonksiyonu
 * @param categoryData - Eklenecek kategori verileri (name, prefix)
 */
export async function addCategory(categoryData: {
  name: string;
  prefix: string;
}) {
  await checkAdminSession(); // Güvenlik: Admin oturum kontrolü

  try {
    console.log("addCategory çağrıldı:", categoryData);

    const { data, error } = await supabaseAdmin // Admin client (RLS bypass)
      .from("categories")
      .insert([categoryData])
      .select();

    if (error) throw error;

    // Cache'i temizle
    revalidatePath("/admin/categories");

    return { success: true, message: "Kategori başarıyla eklendi", data };
  } catch (error) {
    console.error("addCategory hatası:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Mevcut kategoriyi güncelleme fonksiyonu
 * @param categoryId - Güncellenecek kategorinin ID'si
 * @param categoryData - Güncellenecek kategori verileri
 */
export async function updateCategory(
  categoryId: number,
  categoryData: { name: string; prefix: string },
) {
  await checkAdminSession(); // Güvenlik: Admin oturum kontrolü

  try {
    console.log("updateCategory çağrıldı:", { categoryId, categoryData });

    const { data, error } = await supabaseAdmin // Admin client (RLS bypass)
      .from("categories")
      .update(categoryData)
      .eq("id", categoryId)
      .select();

    if (error) throw error;

    // Cache'i temizle
    revalidatePath("/admin/categories");

    return { success: true, message: "Kategori başarıyla güncellendi", data };
  } catch (error) {
    console.error("updateCategory hatası:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Kategori silme fonksiyonu
 * Foreign key kısıtlamasına saygılı güvenli silme işlemi
 * @param categoryId - Silinecek kategorinin ID'si
 */
export async function deleteCategory(categoryId: number) {
  await checkAdminSession(); // Güvenlik: Admin oturum kontrolü

  try {
    console.log("🔍 deleteCategory çağrıldı - Kontrol edilen ID:", categoryId);
    console.log("🔍 ID tipi:", typeof categoryId);

    // ADIM 1: Kategoriye ait ürün kontrolü
    console.log("📊 ADIM 1: Kategoriye ait ürün kontrolü başlıyor...");
    const { data: productsInCategory, error: checkError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("category_id", categoryId)
      .limit(1);

    console.log("📊 Ürün kontrolü sonucu:", {
      productsFound: productsInCategory?.length || 0,
      productsData: productsInCategory,
      checkError: checkError ? JSON.stringify(checkError) : null,
    });

    if (checkError) {
      console.error("❌ Ürün kontrolü hatası:", JSON.stringify(checkError));
      throw checkError;
    }

    // ADIM 2: Ürün varsa işlemi durdur
    if (productsInCategory && productsInCategory.length > 0) {
      console.log(
        "⚠️ Kategoriye ait ürün bulundu, silme işlemi iptal ediliyor",
      );
      return {
        success: false,
        error:
          "Bu kategoriye ait ürünler bulunuyor. Kategoriyi silebilmek için önce içindeki ürünleri silmeli veya başka kategoriye taşımalısınız.",
      };
    }

    // ADIM 2.5: product_models tablosunda kontrol
    console.log("📊 ADIM 2.5: product_models tablosunda kontrol...");
    const { data: modelsInCategory, error: modelsCheckError } =
      await supabaseAdmin
        .from("product_models")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1);

    console.log("📊 Model kontrolü sonucu:", {
      modelsFound: modelsInCategory?.length || 0,
      modelsData: modelsInCategory,
      modelsCheckError: modelsCheckError
        ? JSON.stringify(modelsCheckError)
        : null,
    });

    if (modelsCheckError) {
      console.error(
        "❌ Model kontrolü hatası:",
        JSON.stringify(modelsCheckError),
      );
      // Model tablosu yoksa veya hata varsa devam et (isteğe bağlı tablo olabilir)
    }

    if (modelsInCategory && modelsInCategory.length > 0) {
      console.log(
        "⚠️ Kategoriye ait model bulundu, silme işlemi iptal ediliyor",
      );
      return {
        success: false,
        error:
          "Bu kategoriye ait modeller bulunuyor. Kategoriyi silebilmek için önce içindeki modelleri silmeli veya başka kategoriye taşımalısınız.",
      };
    }

    // ADIM 3: Güvenli silme işlemi
    console.log("🗑️ ADIM 3: Kategori silme işlemi başlıyor...");
    const { data: deletedData, error: deleteError } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .select(); // Silinen veriyi görmek için select ekle

    console.log("🗑️ Silme işlemi sonucu:", {
      deletedData,
      deleteError: deleteError ? JSON.stringify(deleteError, null, 2) : null,
      errorMessage: deleteError?.message,
      errorDetails: deleteError?.details,
      errorHint: deleteError?.hint,
      errorCode: deleteError?.code,
    });

    if (deleteError) {
      console.error(
        "❌ Kategori silme hatası (tam detay):",
        JSON.stringify(deleteError, null, 2),
      );
      throw deleteError;
    }

    console.log("✅ Kategori başarıyla silindi:", deletedData);

    // Cache'i temizle - Kategori listesini yeniden yükle
    revalidatePath("/admin/categories");

    return { success: true, message: "Kategori başarıyla silindi" };
  } catch (error) {
    console.error("❌ deleteCategory genel hatası:", error);
    console.error("❌ Hata detayı (JSON):", JSON.stringify(error, null, 2));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}
