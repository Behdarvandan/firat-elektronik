import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env variables are missing during this execution layer.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
);

// Hangi anahtarın tarayıcıya gömüldüğünü canlı canlı görmek için debug logu:
if (typeof window !== "undefined") {
  console.log(
    "Canlı Tarayıcı Key Kontrolü (İlk 5 hane):",
    supabaseAnonKey?.slice(0, 5),
  );
}
