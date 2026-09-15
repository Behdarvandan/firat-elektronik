"use client";

import { logoutAction } from "./actions";
import type { ProductSummary } from "@/types/catalog";
import AddToCartButton from "../components/AddToCartButton";
import { useCart } from "../components/CartProvider";
import Link from "next/link";

// Sunucudan gelen ürün özeti
export type B2bProduct = ProductSummary;

type Organization = { id: string; name: string; email: string };

export default function B2BDashboard({
  organization,
  products,
}: {
  organization: Organization;
  products: B2bProduct[];
}) {
  // Sepet artık global CartProvider'da tutulur; burada yalnızca özet gösterilir.
  const { totalCount, totalAmount } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bayi Paneli</h1>
          <p className="text-slate-600 mt-1">
            Hoş geldiniz,{" "}
            <span className="font-semibold">{organization.name}</span>{" "}
            <span className="text-slate-400">({organization.email})</span>
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            Çıkış Yap
          </button>
        </form>
      </div>

      {/* Fiyatlandırma notu */}
      <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
        ⚠️ Fiyatlandırma modülü henüz bağlanmadığı için birim fiyatlar{" "}
        <strong>0</strong> olarak kaydedilir.
      </div>

      {/* İçerik: ürün listesi + sepet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ürün Listesi */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Ürünler{" "}
            <span className="text-slate-400 font-normal text-sm">
              ({products.length} gösteriliyor)
            </span>
          </h2>

          {products.length === 0 ? (
            <p className="text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
              Ürün bulunamadı.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-500/30 hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 flex-1">
                    <span className="font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5">
                      {p.box_code || "Kutu kodu yok"}
                    </span>
                  </p>
                  <AddToCartButton
                    product={{ id: p.id, name: p.name, box_code: p.box_code }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sepet Özeti */}
        <aside>
          <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Sepet Özeti
            </h2>

            <p className="text-sm text-slate-500">
              Sepetinizde{" "}
              <span className="font-semibold text-slate-900">{totalCount}</span>{" "}
              ürün bulunuyor.
            </p>

            <div className="border-t border-slate-200 mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Toplam</span>
                <span className="text-lg font-bold text-slate-900">
                  ₺{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-4 w-full block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
            >
              Siparişi Tamamla
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
