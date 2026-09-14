import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ✅ DEĞİŞTİRİLDİ: Ünlem (!) yerine OR (||) operatörü ile varsayılan değer atandı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ✅ EKLENDİ: Çevre değişkenleri eksikse sistemin anında anlaşılır bir uyarı fırlatması sağlandı
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "KRİTİK HATA: SUPABASE_SERVICE_ROLE_KEY veya URL .env.local dosyasında bulunamadı!",
  );
}

// Admin yetkisine sahip Supabase client (Service Role Key kullanır)
// Bu client RLS (Row Level Security) kurallarını bypass eder
const globalForSupabaseAdmin = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined;
};

export const supabaseAdmin =
  globalForSupabaseAdmin.supabaseAdmin ??
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabaseAdmin.supabaseAdmin = supabaseAdmin;
}
