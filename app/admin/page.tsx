import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_PANEL_NAME } from "@/lib/site-config";

export const dynamic = "force-dynamic";

// İstatistikleri Supabase'den çek
async function getStats() {
  try {
    // Kategoriler sayısını al
    const { count: categoriesCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    // Ürünler sayısını al
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Modeller sayısını al
    const { count: modelsCount } = await supabase
      .from("product_models")
      .select("*", { count: "exact", head: true });

    // Sipariş sayısını al (orders RLS korumalı → service role gerekir)
    const { count: ordersCount } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true });

    return {
      categories: categoriesCount || 0,
      products: productsCount || 0,
      models: modelsCount || 0,
      orders: ordersCount || 0,
    };
  } catch (error) {
    console.error("İstatistikler yüklenemedi:", error);
    return {
      categories: 0,
      products: 0,
      models: 0,
      orders: 0,
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
          {ADMIN_PANEL_NAME}
        </h1>
        <p className="text-slate-400 text-sm md:text-lg">
          Hoş geldiniz! Sol menüden ürün ve kategori yönetimi yapabilirsiniz.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Kategoriler */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-purple-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Toplam Kategoriler
              </p>
              <p className="text-3xl font-bold text-white">
                {stats.categories}
              </p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <svg
                className="w-8 h-8 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Ürünler */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Toplam Ürünler
              </p>
              <p className="text-3xl font-bold text-white">{stats.products}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Modeller */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-green-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Toplam Modeller
              </p>
              <p className="text-3xl font-bold text-white">{stats.models}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Siparişler */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-orange-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Toplam Siparişler
              </p>
              <p className="text-3xl font-bold text-white">{stats.orders}</p>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <svg
                className="w-8 h-8 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/products"
            className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50"
          >
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Yeni Ürün Ekle</p>
              <p className="text-slate-400 text-sm">Kataloğa ürün ekleyin</p>
            </div>
          </a>

          <a
            href="/admin/categories"
            className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50"
          >
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Yeni Kategori Ekle</p>
              <p className="text-slate-400 text-sm">Kategori oluşturun</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
