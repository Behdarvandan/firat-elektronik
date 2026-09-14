import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Products verisini çek (server-side pagination)
async function getProducts(page: number = 1) {
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Toplam kayıt sayısını al
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // Sayfalı veriyi çek - Sadece ürün tablosundan veri çek (join yok)
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, name, description, category_id") // created_at kaldırıldı (kolon veritabanında yok)
    .order("id", { ascending: false }) // En yeni ürünler ilk sırada
    .range(from, to);

  if (productsError) {
    console.error("❌ Ürün yükleme hatası detayları:", {
      message: productsError.message,
      details: productsError.details,
      hint: productsError.hint,
      code: productsError.code,
      fullError: JSON.stringify(productsError, null, 2),
    });
    return { products: [], totalCount: 0 };
  }

  // Kategorileri ayrı bir sorgu ile çek
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name");

  if (categoriesError) {
    console.error("❌ Kategori yükleme hatası:", categoriesError);
  }

  // Kategorileri map'e çevir (hızlı erişim için)
  const categoriesMap = new Map(
    categoriesData?.map((cat) => [cat.id, cat.name]) || [],
  );

  // Ürünlere kategori adını JavaScript seviyesinde eşleştir
  const products =
    productsData?.map((product) => ({
      ...product,
      categories: {
        name: categoriesMap.get(product.category_id) || "N/A",
      },
    })) || [];

  return { products, totalCount: count || 0 };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const { products, totalCount } = await getProducts(currentPage);
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Mobilde daha kompakt */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
          Ürün Yönetimi
        </h1>
        <p className="text-slate-400 text-sm md:text-lg">
          Katalog ürünlerini görüntüleyin ve yönetin
        </p>
      </div>

      {/* Stats - Mobilde alt alta */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-slate-400">
          Toplam <span className="text-white font-semibold">{totalCount}</span>{" "}
          ürün bulundu
        </div>
        <div className="text-slate-400">
          Sayfa {currentPage} / {totalPages}
        </div>
      </div>

      {/* 📱 Data Table - Mobil Overflow Koruması */}
      <div className="w-full overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-slate-800">
        <div className="bg-slate-900 min-w-max sm:min-w-0">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  ID
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Görsel
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Ürün Adı
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Kategori
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Açıklama
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Henüz ürün bulunmuyor
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 whitespace-nowrap">
                      {product.id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {/* ✅ GÜVENLİ PLACEHOLDER: image_url kolonu veritabanından silindi */}
                      <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center text-slate-600">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300">
                        {product.categories?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-400 max-w-[200px] sm:max-w-md truncate">
                      {product.description || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 Pagination - Mobilde daha kompakt */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {/* Previous Button - Mobilde daha kısa */}
          {currentPage > 1 ? (
            <Link
              href={`/admin/products?page=${currentPage - 1}`}
              className="px-3 sm:px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              <span className="hidden sm:inline">← Önceki</span>
              <span className="sm:hidden">←</span>
            </Link>
          ) : (
            <button
              disabled
              className="px-3 sm:px-4 py-2 bg-slate-800/50 text-slate-600 rounded-lg cursor-not-allowed text-sm"
            >
              <span className="hidden sm:inline">← Önceki</span>
              <span className="sm:hidden">←</span>
            </button>
          )}

          {/* Page Numbers */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Sadece aktif sayfa ve yakınındaki sayfa numaralarını göster
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Link
                    key={page}
                    href={`/admin/products?page=${page}`}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                      page === currentPage
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </Link>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return (
                  <span key={page} className="px-2 py-2 text-slate-600">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          {/* Next Button - Mobilde daha kısa */}
          {currentPage < totalPages ? (
            <Link
              href={`/admin/products?page=${currentPage + 1}`}
              className="px-3 sm:px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              <span className="hidden sm:inline">Sonraki →</span>
              <span className="sm:hidden">→</span>
            </Link>
          ) : (
            <button
              disabled
              className="px-3 sm:px-4 py-2 bg-slate-800/50 text-slate-600 rounded-lg cursor-not-allowed text-sm"
            >
              <span className="hidden sm:inline">Sonraki →</span>
              <span className="sm:hidden">→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
