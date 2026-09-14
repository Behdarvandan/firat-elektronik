import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Product Models verisini çek (server-side pagination)
async function getModels(page: number = 1) {
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Toplam kayıt sayısını al
  const { count } = await supabase
    .from("product_models")
    .select("*", { count: "exact", head: true });

  // Sayfalı veriyi çek
  const { data, error } = await supabase
    .from("product_models")
    .select(
      `
      id,
      model_name,
      description,
      price,
      image_url,
      product_id,
      sort_order,
      created_at,
      products (
        name
      )
    `,
    )
    .order("product_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Modeller yüklenemedi:", error);
    return { models: [], totalCount: 0 };
  }

  return { models: data || [], totalCount: count || 0 };
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const { models, totalCount } = await getModels(currentPage);
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Model Yönetimi</h1>
        <p className="text-slate-400 text-lg">
          Ürün modellerini görüntüleyin ve yönetin
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-slate-400">
          Toplam <span className="text-white font-semibold">{totalCount}</span>{" "}
          model bulundu
        </div>
        <div className="text-slate-400">
          Sayfa {currentPage} / {totalPages}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Model ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Görsel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Model Adı
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Açıklama
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {models.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Henüz model bulunmuyor
                  </td>
                </tr>
              ) : (
                models.map((model: any) => (
                  <tr
                    key={model.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-slate-400">
                        {model.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {model.image_url ? (
                        <img
                          src={model.image_url}
                          alt={model.model_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
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
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {model.model_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300">
                        {model.products?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {model.price ? (
                        <div className="text-sm font-semibold text-green-400">
                          {model.price}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-md truncate">
                      {model.description || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {/* Previous Button */}
          {currentPage > 1 ? (
            <Link
              href={`/admin/models?page=${currentPage - 1}`}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ← Önceki
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-slate-800/50 text-slate-600 rounded-lg cursor-not-allowed"
            >
              ← Önceki
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
                    href={`/admin/models?page=${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors ${
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

          {/* Next Button */}
          {currentPage < totalPages ? (
            <Link
              href={`/admin/models?page=${currentPage + 1}`}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Sonraki →
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-slate-800/50 text-slate-600 rounded-lg cursor-not-allowed"
            >
              Sonraki →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
