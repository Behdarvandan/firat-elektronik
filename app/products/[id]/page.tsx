import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

// Ürün detayı her istekte güncel kalsın diye dinamik render.
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  if (!rawId) return notFound();

  const productId = parseInt(rawId, 10);
  if (Number.isNaN(productId)) return notFound();

  const { data: productData, error } = await supabase
    .from("products")
    .select(
      `
      id, name, box_code, category_id,
      categories ( name ),
      product_models ( id, model_name )
    `,
    )
    .eq("id", productId)
    .single();

  if (error || !productData) return notFound();

  const product = productData;

  // Uyumlu modelleri alfabetik sıralayarak okunabilirliği artır.
  const sortedModels = [...(product.product_models ?? [])].sort((a, b) =>
    a.model_name.localeCompare(b.model_name),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Üst bilgi bandı */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          {/* Geri dönüş bağlantısı */}
          <Link
            href={`/category/${product.category_id}`}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors text-sm font-medium mb-5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kategoriye dön
          </Link>

          <div className="flex flex-col gap-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {/* Kutu kodu — ürünü tanımlayan ana kimlik */}
              <span className="inline-flex items-center gap-2 bg-white text-blue-700 font-mono font-bold px-4 py-2 rounded-xl shadow-md text-sm">
                {product.box_code}
              </span>
              {product.categories?.name && (
                <span className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-50 px-4 py-2 rounded-full text-sm font-semibold">
                  {product.categories.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Uyumlu modeller bölümü */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Uyumlu Telefon Modelleri
            </h2>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              {sortedModels.length}
            </span>
          </div>

          {sortedModels.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <p className="text-slate-500">
                Bu ürün için henüz model tanımlanmamış.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedModels.map((model) => (
                <span
                  key={model.id}
                  className="inline-flex items-center bg-white text-slate-700 text-sm font-medium px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm hover:border-blue-500/30 hover:text-blue-700 hover:-translate-y-0.5 transition-all"
                >
                  {model.model_name}
                </span>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
