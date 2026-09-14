import ExcelImportClient from "./ExcelImportClient";

export const dynamic = "force-dynamic";

// Admin panelinde Excel ile toplu ürün/model yükleme sayfası.
// Etkileşimli yükleme arayüzü client bileşeninde; format rehberi aşağıda statik.
export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Excel ile Toplu Yükleme
        </h1>
        <p className="text-slate-400">
          İşletmenizin Excel dosyasından ürünleri ve modelleri topluca içe aktarın.
        </p>
      </div>

      <ExcelImportClient />

      {/* Excel Formatı Rehberi */}
      <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">Excel Formatı</h2>
          <a
            href="/admin/import/template"
            className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Şablonu İndir
          </a>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          İki ayrı sayfa (sheet) kullanın. Sütun adları esnektir — İngilizce veya
          Türkçe başlıklar otomatik tanınır.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-blue-300 mb-2">
              Sayfa 1 — “products”
            </h3>
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-2 font-medium">Sütun</th>
                  <th className="py-1 font-medium">Zorunlu</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1 pr-2">id</td><td>Evet</td></tr>
                <tr><td className="py-1 pr-2">name</td><td>Evet</td></tr>
                <tr><td className="py-1 pr-2">category_id</td><td>Evet</td></tr>
                <tr><td className="py-1 pr-2">box_code</td><td>Hayır</td></tr>
                <tr><td className="py-1 pr-2">description</td><td>Hayır</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-medium text-green-300 mb-2">
              Sayfa 2 — “models”
            </h3>
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-2 font-medium">Sütun</th>
                  <th className="py-1 font-medium">Zorunlu</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1 pr-2">id</td><td>Hayır*</td></tr>
                <tr><td className="py-1 pr-2">model_name</td><td>Evet</td></tr>
                <tr><td className="py-1 pr-2">product_id</td><td>Evet</td></tr>
                <tr><td className="py-1 pr-2">sort_order</td><td>Hayır</td></tr>
                <tr><td className="py-1 pr-2">is_new</td><td>Hayır</td></tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              * Model <code>id</code> verilmezse ürün id&apos;sinden otomatik
              üretilir (örn. “16_0”).
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          İpucu: İsterseniz tek sayfa (flat) da kullanabilirsiniz — aynı sayfada
          hem ürün hem model sütunları varsa otomatik algılanır.
        </p>
      </div>
    </div>
  );
}
