"use client";

import { useState } from "react";
import {
  createOrderAction,
  logoutAction,
  type OrderItemInput,
} from "./actions";

// Sunucudan gelen ürün özeti
export type B2bProduct = {
  id: number;
  name: string;
  box_code: string;
  category_id: number;
};

// Sepetteki satır = ürün + adet + birim fiyat
type CartLine = B2bProduct & { quantity: number; unit_price: number };

type Organization = { id: string; name: string; email: string };

export default function B2BDashboard({
  organization,
  products,
}: {
  organization: Organization;
  products: B2bProduct[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 📌 BİRİM FİYAT: products tablosunda fiyat kolonu henüz yok.
  // enterprise-saas-starter'da fiyatlar ayrı bir fiyat listesi / teklif
  // tablosundan gelir. Bu iskelette birim fiyat 0 kabul edilir; production'da
  // MUTLAKA sunucuda güvenilir kaynaktan çekilmelidir.
  const DEMO_UNIT_PRICE = 0;

  function addToCart(product: B2bProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        { ...product, quantity: 1, unit_price: DEMO_UNIT_PRICE },
      ];
    });
  }

  function changeQuantity(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  const totalAmount = cart.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0,
  );

  async function submitOrder() {
    if (cart.length === 0) return;

    setSubmitting(true);
    setMessage(null);

    const items: OrderItemInput[] = cart.map((l) => ({
      product_id: l.id,
      quantity: l.quantity,
      unit_price: l.unit_price,
    }));

    const result = await createOrderAction(items);

    if (result.success) {
      setCart([]);
      setMessage({
        type: "success",
        text: `Sipariş talebi oluşturuldu (Sipariş No: ${result.orderId}).`,
      });
    } else {
      setMessage({
        type: "error",
        text: result.error ?? "Sipariş oluşturulamadı.",
      });
    }

    setSubmitting(false);
  }

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
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                  >
                    Sepete Ekle
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sepet */}
        <aside>
          <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Sepet</h2>

            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm">Sepetiniz boş.</p>
            ) : (
              <ul className="space-y-3">
                {cart.map((l) => (
                  <li key={l.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {l.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {l.quantity} adet
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(l.id, -1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        aria-label="Azalt"
                      >
                        −
                      </button>
                      <span className="text-sm w-6 text-center font-medium">
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(l.id, 1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        aria-label="Artır"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Toplam */}
            <div className="border-t border-slate-200 mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Toplam</span>
                <span className="text-lg font-bold text-slate-900">
                  ₺{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Sipariş Butonu */}
            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || cart.length === 0}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
            >
              {submitting ? "Gönderiliyor..." : "Sipariş Talebi Oluştur"}
            </button>

            {/* Durum Mesajı */}
            {message && (
              <div
                className={`mt-4 px-4 py-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
