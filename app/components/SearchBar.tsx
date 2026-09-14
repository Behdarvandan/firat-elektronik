"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// 🎨 Kategori renk ve ikon sistemi
const CATEGORY_COLORS: {
  [key: number]: { bg: string; text: string; border: string; icon: string };
} = {
  4: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "🛡️",
  },
  5: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: "✨",
  },
  6: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "🔒",
  },
  7: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    icon: "🌟",
  },
};

// Kategori renk/ikon tipi + bilinmeyen kategoriler için deterministik yedek palet.
type CategoryColor = {
  bg: string;
  text: string;
  border: string;
  icon: string;
};

const FALLBACK_COLORS: CategoryColor[] = [
  { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "📦" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "💎" },
  { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: "🧩" },
];

// Kategoriye göre gruplanmış sonuç bloğu (dropdown bölüm başlıkları için).
type CategoryGroup = {
  category_id: number;
  category_name: string;
  items: SearchResult[];
};

const MAX_RESULTS = 50;

// ⚡ Veritabanından gelen BİREBİR aynı tipler
type SearchResult = {
  id: string;
  model_name: string;
  product_id: number;
  product_name: string;
  box_code: string;
  category_id: number;
  category_name: string;
};

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Klavye navigasyonu için aktif sonuç indeksi (-1 = seçili yok)
  const [activeIndex, setActiveIndex] = useState(-1);

  // ✅ UX: Dışarı tıklama kontrolü için ref + input'a odaklanma için ref
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Uçuştaki isteği izler; useCallback bağımlılığına girmemesi için state yerine ref kullanılır.
  const isLoadingRef = useRef(false);

  // 🎯 Sonuçları kategori adına göre grupla (dropdown bölüm başlıkları için).
  const groupedResults = useMemo<CategoryGroup[]>(() => {
    const groups = new Map<string, CategoryGroup>();
    for (const item of results) {
      const key = item.category_name || `#${item.category_id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, {
          category_id: item.category_id,
          category_name: item.category_name,
          items: [item],
        });
      }
    }
    return Array.from(groups.values());
  }, [results]);

  // Klavye navigasyonu, grup başlıklarını atlayarak yalnızca sonuç öğeleri üzerinde gezer.
  const flatItems = useMemo<SearchResult[]>(
    () => groupedResults.flatMap((g) => g.items),
    [groupedResults],
  );

  const fetchResults = useCallback(async (query: string) => {
    // ✅ GÜVENLİK: Zaten yükleme yapılıyorsa yeni sorgu başlatma (race condition koruması)
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setHasSearched(true);
    setActiveIndex(-1);
    try {
      // ✅ GÜVENLİK: Boş/undefined/sadece boşluk kontrolü
      if (!query || query.length === 0) {
        isLoadingRef.current = false;
        setResults([]);
        setIsLoading(false);
        return;
      }

      // ✅ GÜVENLİK: PostgREST .or() filtre sözdizimini bozabilecek karakterleri
      // silmek yerine backslash ile kaçışla (\, ", ,, (, ) karakterleri)
      const sanitizedQuery = query
        .substring(0, 100) // Maksimum 100 karakter
        .replace(/[\\",()]/g, (char) => `\\${char}`);

      // ✅ GÜVENLİK: Sanitize sonrası boşluk kontrolü
      if (!sanitizedQuery || sanitizedQuery.length === 0) {
        isLoadingRef.current = false;
        setResults([]);
        setIsLoading(false);
        return;
      }

      // 🔧 DÜZELTME: İki ayrı sorgu atıyoruz (PostgREST PGRST100 hatası önleme)
      // ❌ SORUN: Tek .or() içinde hem ana tablo hem foreign tablo aranamaz
      // ✅ ÇÖZÜM: products ve product_models için ayrı sorgular + JavaScript birleştirme

      // 📦 SORGU 1: products tablosunda ürün adı VE kutu kodu araması
      // 🎯 Çift tırnak kullanımı önemli: "%${sanitizedQuery}%" formatı
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          box_code,
          category_id,
          categories!inner (
            id,
            name
          ),
          product_models (
            id,
            model_name,
            product_id
          )
        `,
        )
        .or(
          `name.ilike."%${sanitizedQuery}%",box_code.ilike."%${sanitizedQuery}%"`,
        ) // ✅ Sanitized query kullan
        .limit(50);

      if (productsError) throw productsError;

      // 📱 SORGU 2: product_models tablosunda model adı araması
      const { data: modelsData, error: modelsError } = await supabase
        .from("product_models")
        .select(
          `
          id,
          model_name,
          product_id,
          products!inner (
            id,
            name,
            box_code,
            category_id,
            categories!inner (
              id,
              name
            )
          )
        `,
        )
        .or(`model_name.ilike."%${sanitizedQuery}%"`) // ✅ Sanitized query kullan
        .limit(50);

      if (modelsError) throw modelsError;

      // 🔄 Products sonuçlarını düzleştir — her ürünün her modeli ayrı satır.
      // (supabase-js ilişkileri dizi olarak tipler; runtime'da to-one obje döndüğü
      // için kendi tiplerimize açıkça cast ediyoruz.)
      const rawProducts = (productsData ?? []) as unknown as {
        id: number;
        name: string;
        box_code: string;
        category_id: number;
        categories: { id: number; name: string };
        product_models?: { id: string; model_name: string; product_id: number }[];
      }[];

      const flattenedProductsResults: SearchResult[] = rawProducts.flatMap(
        (product) =>
          (product.product_models ?? []).map((model) => ({
            id: model.id,
            model_name: model.model_name,
            product_id: product.id,
            product_name: product.name,
            box_code: product.box_code,
            category_id: product.category_id,
            category_name: product.categories.name,
          })),
      );

      // 🔄 Models sonuçlarını düzleştir.
      const rawModels = (modelsData ?? []) as unknown as {
        id: string;
        model_name: string;
        products: {
          id: number;
          name: string;
          box_code: string;
          category_id: number;
          categories: { id: number; name: string };
        };
      }[];

      const flattenedModelsResults: SearchResult[] = rawModels.map((item) => ({
        id: item.id,
        model_name: item.model_name,
        product_id: item.products.id,
        product_name: item.products.name,
        box_code: item.products.box_code,
        category_id: item.products.category_id,
        category_name: item.products.categories.name,
      }));

      // 🔀 İki sorguyu JavaScript seviyesinde birleştir
      const combinedResults = [
        ...flattenedProductsResults,
        ...flattenedModelsResults,
      ];

      // 🎯 Tekrar edenleri temizle (aynı model_id + product_id kombinasyonu)
      const uniqueResults = combinedResults.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.id === item.id && t.product_id === item.product_id,
          ),
      );

      // 📊 Alfabetik sıralama
      uniqueResults.sort((a, b) => a.model_name.localeCompare(b.model_name));

      // 🎯 İlk 50 sonuçla sınırla (DoS koruması)
      setResults(uniqueResults.slice(0, 50));
    } catch (error) {
      // ❌ HATA YÖNETİMİ: Kullanıcıya detaylı hata gösterme (güvenlik)
      console.error("Arama hatası:", error);
      setResults([]);

      // Hata durumunda kullanıcıya bilgi ver (production'da detay gösterme)
      if (process.env.NODE_ENV === "development") {
        console.error("Arama hatası detayı:", error);
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 🚀 PERFORMANS: 300ms Debounce — kullanıcı yazmayı bitirdikten sonra arar.
    const timer = setTimeout(() => {
      const cleanedTerm = searchTerm.trim();
      if (cleanedTerm.length === 0 || cleanedTerm.length < 2 || cleanedTerm.length > 100) {
        setResults([]);
        setHasSearched(false);
        setActiveIndex(-1);
        return;
      }
      void fetchResults(cleanedTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchResults]);

  // ✅ UX: Dışarı tıklamada dropdown'ı kapat.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setHasSearched(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Kategori rengini döndür; bilinmeyen ID için deterministik yedek palet kullan.
  const getCategoryColor = (categoryId: number): CategoryColor => {
    return CATEGORY_COLORS[categoryId] || FALLBACK_COLORS[categoryId % FALLBACK_COLORS.length];
  };

  const clearSearch = () => {
    setSearchTerm("");
    setResults([]);
    setHasSearched(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const closeDropdown = () => {
    setHasSearched(false);
    setActiveIndex(-1);
  };

  // ⌨️ Klavye navigasyonu: ok tuşları ile gezin, Enter ile aç, Escape ile kapat.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeDropdown();
      return;
    }
    if (!hasSearched || flatItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      window.location.href = `/category/${flatItems[activeIndex].category_id}`;
    }
  };

  const isDropdownOpen = hasSearched && searchTerm.trim().length >= 2;

  return (
    <div ref={searchBarRef} className="relative w-full max-w-2xl mx-auto">
      {/* 🔍 Arama Kutusu */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-controls="search-results-list"
          aria-autocomplete="list"
          aria-label="Ürün veya model ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.substring(0, 100))}
          onKeyDown={handleKeyDown}
          placeholder="Model arayın… (Örn: iPhone 15, Samsung S24, Xiaomi 14)"
          maxLength={100}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className="w-full px-5 py-4 pl-12 pr-12 text-lg bg-white border-2 border-blue-600 rounded-full shadow-lg shadow-blue-600/10 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 placeholder-slate-400"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Temizle butonu — yalnızca yazı varken görünür */}
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Aramayı temizle"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 📋 Arama Sonuçları Dropdown */}
      {isDropdownOpen && (
        <div
          id="search-results-list"
          role="listbox"
          aria-label="Arama sonuçları"
          className="absolute w-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-[32rem] overflow-y-auto overflow-x-hidden backdrop-blur-sm animate-fade-slide-down"
        >
          {isLoading ? (
            // ⏳ Yükleme durumu
            <div className="p-8 text-center" aria-live="polite">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-base font-semibold text-slate-700">
                  Katalog taranıyor…
                </p>
                <p className="text-sm text-slate-400">Lütfen bekleyin</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {/* Sonuç sayısı başlığı */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">
                  <span className="text-blue-600 text-lg">{results.length}</span>{" "}
                  uyumlu sonuç bulundu
                  {results.length === MAX_RESULTS && (
                    <span className="ml-2 text-xs text-orange-600 font-medium">
                      (İlk {MAX_RESULTS} sonuç)
                    </span>
                  )}
                </p>
              </div>

              {/* 🎯 Kategoriye göre gruplanmış sonuçlar */}
              {groupedResults.map((group) => {
                const groupColor = getCategoryColor(group.category_id);
                return (
                  <div key={`${group.category_id}-${group.category_name}`}>
                    {/* Kategori bölüm başlığı */}
                    <div className="px-4 pt-3 pb-1.5 bg-slate-50/80 border-b border-slate-100 sticky top-0 backdrop-blur-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold ${groupColor.bg} ${groupColor.text} border ${groupColor.border} rounded-full`}
                      >
                        <span aria-hidden="true">{groupColor.icon}</span>
                        <span className="truncate max-w-[280px]">{group.category_name}</span>
                        <span className="opacity-60">· {group.items.length}</span>
                      </span>
                    </div>

                    {group.items.map((item) => {
                      const flatIndex = flatItems.indexOf(item);
                      const isActive = flatIndex === activeIndex;
                      return (
                        <Link
                          key={`${item.id}-${item.product_id}`}
                          href={`/category/${item.category_id}`}
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={`block border-b border-slate-100 last:border-0 transition-colors duration-150 group ${
                            isActive ? "bg-blue-50/70" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="p-4 flex items-center justify-between gap-4">
                            {/* Sol: model + ürün adı */}
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-bold text-base truncate transition-colors ${
                                  isActive ? "text-blue-700" : "text-slate-900"
                                }`}
                              >
                                {item.model_name}
                              </h3>
                              <p className="text-sm text-slate-600 truncate mt-0.5">
                                {item.product_name}
                              </p>
                            </div>

                            {/* Sağ: kutu kodu */}
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                Kutu Kodu
                              </span>
                              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-1.5 px-3.5 rounded-xl font-mono font-bold shadow-sm group-hover:shadow-md transition-shadow text-sm">
                                {item.box_code}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            // 😕 Boş durum (sonuç bulunamadı)
            <div className="p-10 text-center flex flex-col items-center justify-center" aria-live="polite">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-900 font-bold text-lg mb-1">
                &quot;{searchTerm}&quot; için sonuç bulunamadı
              </p>
              <p className="text-slate-500 text-sm max-w-md">
                Model adını, ürün adını veya kutu kodunu kontrol edip tekrar deneyin.
              </p>
              <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 İpucu: &quot;Samsung A51&quot;, &quot;iPhone 13&quot; veya model kodu ile arayabilirsiniz
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
