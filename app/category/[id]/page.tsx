import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link"; // Pagination için Link bileşeni
import AddToCartButton from "../../components/AddToCartButton";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

const ITEMS_PER_PAGE = 20; // Sayfa başına ürün sayısı

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams; // URL'den searchParams oku
  const rawId = resolvedParams?.id;

  if (!rawId) return notFound();
  const categoryId = parseInt(rawId, 10);
  if (isNaN(categoryId)) return notFound();

  // URL'den page parametresini oku, varsayılan 1
  const currentPage = parseInt(resolvedSearchParams?.page || "1", 10);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 1. Kategori bilgisini al
  const { data: categoryData, error } = await supabase
    .from("categories")
    .select("id, name, prefix")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !categoryData) {
    console.error("Veritabanı hatası:", error);
    return notFound();
  }

  // 2. Toplam ürün sayısını al (pagination için)
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  // 3. Sayfalanmış ürünleri al - range() ile Server-Side Pagination
  // Alt modelleri de dahil et (product_models join ile - ✅ DÜZELTİLDİ: product_mobiles → product_models)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      box_code, 
      product_code,
      product_models(id, model_name)
    `,
      // ✅ DÜZELTİLDİ: mobile:mobiles(...) kaldırıldı, model_name direkt product_models'den alınıyor
    )
    .eq("category_id", categoryId)
    .order("id", { ascending: false }) // ✅ created_at yerine id ile sıralama (en yeni ürünler önce)
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  // Hata kontrolü ekle
  if (productsError) {
    console.error("❌ KATEGORİ SAYFASI VERİ HATASI:", productsError);
  }

  const totalPages = Math.ceil((totalProducts || 0) / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* SAYFA BAŞLIĞI - Tech-Blue Banner */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 lg:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-12 bg-white rounded-full"></div>
            <h1 className="text-4xl font-bold tracking-tight">
              {categoryData.name}
            </h1>
          </div>
          {categoryData.prefix && (
            <p className="text-blue-100 text-sm ml-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-300 rounded-full"></span>
              Kategori Öneki:{" "}
              <span className="font-semibold">{categoryData.prefix}</span>
            </p>
          )}
          <div className="mt-6 flex items-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
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
              <span className="font-medium">{totalProducts || 0}</span> Ürün
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Sayfa {currentPage} / {totalPages}
            </div>
          </div>
        </div>
      </header>

      {/* ÜRÜN GRİDİ */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 w-full md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products?.map((product) => {
            // ✅ DÜZELTİLDİ: pm.mobile.name yerine pm.model_name kullanılıyor (yeni yapı)
            const models = product.product_models || [];
            const displayedModels = models.slice(0, 6);
            const remainingCount = models.length - displayedModels.length;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 border border-slate-100 overflow-hidden flex flex-col"
              >
                {/* Kutu Kodu Badge — ürünü tanımlayan en önemli bilgi vurgulanır */}
                <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3 border-b border-slate-100">
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {product.box_code}
                  </span>
                </div>

                {/* Ürün İçeriği */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Ürün Adı - Line Clamp ile Uzun İsimler İçin Koruma */}
                  <h3 className="font-bold text-slate-900 text-base leading-tight mb-4 group-hover:text-blue-700 transition-colors line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>

                  {/* Alt Modeller - Pill Format - Flex-1 ile Kart Altında Sabitle */}
                  {models.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Uyumlu Modeller
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {/* ✅ DÜZELTİLDİ: mobile.name yerine model.model_name kullanılıyor */}
                        {displayedModels.map((model, idx: number) => (
                          <span
                            key={model.id || idx}
                            className="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors"
                          >
                            {model.model_name}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            +{remainingCount} model
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      box_code: product.box_code,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Ürün yoksa mesaj */}
        {(!products || products.length === 0) && (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-slate-500 text-lg font-medium">
              Bu kategoride henüz ürün bulunmuyor
            </p>
          </div>
        )}

        {/* PAGINATION - Modern Tasarım */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-8 md:mt-12 pb-6 md:pb-8">
            {currentPage > 1 ? (
              <Link
                href={`/category/${categoryId}?page=${currentPage - 1}`}
                className="group w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
              >
                <svg
                  className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Önceki Sayfa
              </Link>
            ) : (
              <button
                disabled
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed font-medium text-sm md:text-base"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Önceki Sayfa
              </button>
            )}

            {/* Sayfa Numarası Göstergesi */}
            <div className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-blue-600 text-blue-700 rounded-lg font-bold shadow-sm text-center text-sm md:text-base">
              {currentPage} / {totalPages}
            </div>

            {currentPage < totalPages ? (
              <Link
                href={`/category/${categoryId}?page=${currentPage + 1}`}
                className="group w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
              >
                Sonraki Sayfa
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ) : (
              <button
                disabled
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed font-medium text-sm md:text-base"
              >
                Sonraki Sayfa
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
