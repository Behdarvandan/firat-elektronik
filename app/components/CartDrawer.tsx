"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

/**
 * Sağdan açılan sepet çekmecesi. Global sepetteki satırları listeler, adet
 * güncelleme / kaldırma sağlar ve siparişi tamamlamak için /checkout'a yönlendirir.
 */
export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
    totalCount,
    totalAmount,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Karartma katmanı */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Çekmece paneli */}
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Sepet"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Sepet
            <span className="text-sm font-medium text-slate-500">
              ({totalCount} ürün)
            </span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Sepeti kapat"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Satırlar */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="w-14 h-14 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-slate-500">Sepetiniz boş.</p>
              <p className="text-slate-400 text-sm mt-1">
                Kategori sayfalarından ürün ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {item.boxCode || "Kutu kodu yok"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-red-500 self-start transition-colors"
                      aria-label="Ürünü kaldır"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-8 h-8 text-slate-600 hover:bg-slate-100 font-semibold"
                        aria-label="Azalt"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-8 h-8 text-slate-600 hover:bg-slate-100 font-semibold"
                        aria-label="Artır"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      ₺{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Alt bölüm */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Toplam</span>
              <span className="text-xl font-bold text-slate-900">
                ₺{totalAmount.toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
            >
              Siparişi Tamamla
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
