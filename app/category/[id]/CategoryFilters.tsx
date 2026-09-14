"use client";

import { useState, useMemo, useEffect } from "react";

type ProductModel = {
  id: string;
  model_name: string;
  sort_order: number;
  is_new: boolean;
};

type Product = {
  id: number;
  name: string;
  box_code: string;
  box_code_note: string;
  capacity: string;
  product_code: string;
  specs: any;
  category_id: number;
  product_models: ProductModel[];
};

type CategoryFiltersProps = {
  allModels: ProductModel[];
  products: Product[];
  onFilterChange?: (filteredProducts: Product[]) => void; // Filtrelenen ürünleri parent'a ilet
};

export default function CategoryFilters({
  allModels,
  products,
  onFilterChange,
}: CategoryFiltersProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  // Dinamik marka listesi oluştur
  const brands = useMemo(() => {
    const brandSet = new Set<string>();

    allModels.forEach((model) => {
      // Model adından ilk kelimeyi ayıkla (Marka)
      // Örn: "SAMSUNG S24" -> "SAMSUNG", "IPHONE 15 PRO" -> "IPHONE"
      const firstWord = model.model_name.trim().split(/\s+/)[0];
      if (firstWord) {
        brandSet.add(firstWord.toUpperCase());
      }
    });

    // Alfabetik sırala
    return Array.from(brandSet).sort();
  }, [allModels]);

  // Filtrelenmiş ürünleri hesapla (DOM manipülasyonu yerine React state kullan)
  const filteredProducts = useMemo(() => {
    // Eğer seçili marka yoksa, tüm ürünleri göster
    if (!selectedBrand) {
      return products;
    }

    // Seçili markaya göre ürünleri filtrele
    return products.filter((product) => {
      return product.product_models?.some((model) => {
        const modelBrand = model.model_name
          .trim()
          .split(/\s+/)[0]
          ?.toUpperCase();
        return modelBrand === selectedBrand;
      });
    });
  }, [selectedBrand, products]);

  // Filtrelenmiş ürünleri parent component'a ilet
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredProducts);
    }
  }, [filteredProducts, onFilterChange]);

  // Filtreleme işlemi - sadece state güncelle
  const handleBrandFilter = (brand: string) => {
    setSelectedBrand(brand);
  };

  // Tümünü göster - filtreyi temizle
  const clearFilter = () => {
    setSelectedBrand("");
  };

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="border-b border-gray-200 pb-3">
        <h2 className="font-bold text-gray-900 text-lg">Filtrele</h2>
        <p className="text-xs text-gray-500 mt-1">
          Marka seçerek ürünleri filtreleyin
        </p>
      </div>

      {/* Marka Listesi */}
      <div>
        <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
          Markalar ({brands.length})
        </h3>

        {brands.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Marka bulunamadı</p>
        ) : (
          <div className="space-y-2">
            {/* Tümü Butonu */}
            <button
              onClick={clearFilter}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedBrand === ""
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tümü ({products.length})
            </button>

            {/* Marka Butonları */}
            {brands.map((brand) => {
              // Bu markaya ait kaç ürün var?
              const productCount = products.filter((product) => {
                return product.product_models?.some((model) => {
                  const modelBrand = model.model_name
                    .trim()
                    .split(/\s+/)[0]
                    ?.toUpperCase();
                  return modelBrand === brand;
                });
              }).length;

              return (
                <button
                  key={brand}
                  onClick={() => handleBrandFilter(brand)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedBrand === brand
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span>{brand}</span>
                    <span
                      className={`text-xs ${
                        selectedBrand === brand
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      {productCount}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Aktif Filtre Bilgisi */}
      {selectedBrand && (
        <div className="pt-3 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-semibold mb-1">
              Aktif Filtre:
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-blue-900">
                {selectedBrand}
              </span>
              <button
                onClick={clearFilter}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
