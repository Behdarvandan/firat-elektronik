import { supabase } from "@/lib/supabase";
import CategoryGrid from "./components/CategoryGrid";
import SearchBar from "./components/SearchBar";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site-config";

// ⚡ MİMARİ DOKUNUŞ: Sayfayı her istekte sıfırdan oluşturmak yerine,
// Arka planda saatte bir (3600 saniye) önbelleğe (Cache) alıyoruz.
// Katalog güncellendiğinde Supabase şemasını yormamış oluruz.
export const revalidate = 3600;

export default async function HomePage() {
  // 🎯 OPTİMİZASYON: Sadece anasayfada göstereceğimiz hafif Kategori verisini çekiyoruz.
  // Altındaki ürünleri ve binlerce modeli buraya yükleyerek RAM'i şişirmiyoruz!
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, prefix")
    .order("id", { ascending: true });

  // Hata yönetimi katmanı
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Sistem Hatası
          </h1>
          <p className="text-red-700">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 🎯 HERO SECTION - Devasa Karşılama Ekranı */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
        {/* Arka Plan Dekoratif Elemanlar */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* İçerik */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
          <div className="text-center space-y-8">
            {/* Ana Slogan */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                {SITE_NAME}{" "}
                <span className="block mt-2 bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                  B2B Ürün Kataloğu
                </span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto font-medium">
                10.000&apos;den fazla model, anında stok sorgulama ve en güncel
                teknik özellikler.
              </p>
            </div>

            {/* 🔍 Ortalanmış Akıllı Arama Çubuğu */}
            <div className="max-w-2xl mx-auto w-full">
              <SearchBar />
            </div>

            {/* 🏷️ Hızlı Değer Önerisi Rozetleri */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 text-blue-50 rounded-full text-sm font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Anlık Stok
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 text-blue-50 rounded-full text-sm font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                10.000+ Model
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 text-blue-50 rounded-full text-sm font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                B2B Fiyatlar
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 text-blue-50 rounded-full text-sm font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Anında Erişim
              </span>
            </div>

            {/* ⚡ İkincil Eylem — Kategorilere kaydır */}
            <Link
              href="#categories"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/30 text-white rounded-full hover:bg-white/10 transition-all duration-300 font-semibold text-base group"
            >
              <span>Tüm Kataloğu İncele</span>
              <svg
                className="w-5 h-5 group-hover:translate-y-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Alt Dalga Efekti */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-auto text-slate-50"
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 C240,80 480,20 720,50 C960,80 1200,20 1440,50 L1440,100 L0,100 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* 📦 KATEGORİ VİTRİNİ */}
      <section
        id="categories"
        className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-16"
      >
        {/* Kategori Başlık */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Kategorilerimizi Keşfedin
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            İncelemek istediğiniz kategoriyi seçerek binlerce modele anında
            ulaşın
          </p>
          <div className="mt-6 w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto rounded-full"></div>
        </div>

        {/* Kategori Grid - Zaten Mükemmel Tasarlanmış Bileşen */}
        <CategoryGrid categories={categories || []} />
      </section>

      {/* 🎨 İSTATİSTİKLER KUTUSU - Opsiyonel Premium Dokunuş */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 w-full md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-blue-200">
                10,000+
              </div>
              <div className="text-lg text-blue-100">Ürün Modeli</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-blue-200">
                {categories?.length || 0}
              </div>
              <div className="text-lg text-blue-100">Kategori</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-blue-200">
                7/24
              </div>
              <div className="text-lg text-blue-100">Anlık Erişim</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
