import { supabase } from "@/lib/supabase";
import CategoriesClient from "./CategoriesClient";
import type { Category } from "@/types/catalog";

export const dynamic = "force-dynamic";

// Kategorileri Supabase'den çek
async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, prefix")
    .order("id", { ascending: true });

  if (error) {
    console.error("Kategoriler yüklenemedi:", error);
    return [];
  }

  return data ?? [];
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
          Kategori Yönetimi
        </h1>
        <p className="text-slate-400 text-sm md:text-lg">
          Katalog kategorilerini yönetin ve düzenleyin
        </p>
      </div>

      {/* Client Component - İnteraktif işlemler için */}
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
