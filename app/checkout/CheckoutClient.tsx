"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../components/CartProvider";
import { createOrderAction, type OrderItemInput } from "../b2b/actions";

type Organization = { id: string; name: string; email: string };

export default function CheckoutClient({
  organization,
}: {
  organization: Organization;
}) {
  const { items, totalCount, totalAmount, clearCart, setQuantity, removeItem } =
    useCart();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setMessage(null);

    const orderItems: OrderItemInput[] = items.map((l) => ({
      product_id: l.productId,
      quantity: l.quantity,
      unit_price: l.unitPrice,
    }));

    const result = await createOrderAction(orderItems, note);

    if (result.success) {
      clearCart();
      setMessage({
        type: "success",
        text: `Sipariş talebiniz alındı (Sipariş No: ${result.orderId}).`,
      });
    } else {
      setMessage({
        type: "error",
        text: result.error ?? "Sipariş oluşturulamadı.",
      });
    }

    setSubmitting(false);
  }

  if (message?.type === "success") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Sipariş Talebi Alındı
          </h1>
          <p className="text-slate-600">{message.text}</p>
          <p className="text-slate-400 text-sm mt-2">
            Talebiniz yönetici onayına iletilmiştir; onay sonrası işleme
            alınacaktır.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Alışverişe Devam Et
            </Link>
            <Link
              href="/b2b"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Bayi Paneline Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-3xl font-bold text-slate-900">Siparişi Onayla</h1>
        <p className="text-slate-600 mt-1">
          {organization.name}{" "}
          <span className="text-slate-400">({organization.email})</span>
        </p>

        {items.length === 0 ? (
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <p className="text-slate-500">Sepetiniz boş.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Kataloğa Göz At
              </Link>
              <Link
                href="/b2b"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Bayi Paneli
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Ürün listesi */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="p-4 sm:p-5 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.boxCode || "Kutu kodu yok"}
                      </p>
                    </div>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0">
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
                    <div className="w-24 text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900">
                        ₺{(item.quantity * item.unitPrice).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        Kaldır
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-5 py-4 flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  Genel Toplam ({totalCount} ürün)
                </span>
                <span className="text-xl font-bold text-slate-900">
                  ₺{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Not */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <label
                htmlFor="note"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Sipariş Notu (opsiyonel)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Teslimat / fatura ile ilgili ek bilgiler..."
              />
            </div>

            {message?.type === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {message.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-center"
              >
                Alışverişe Devam Et
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
              >
                {submitting ? "Gönderiliyor..." : "Sipariş Talebini Gönder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
