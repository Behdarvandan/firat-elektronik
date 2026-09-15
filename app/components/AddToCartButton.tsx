"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

type AddToCartProduct = {
  id: number;
  name: string;
  box_code: string | null;
};

/**
 * Kategori ve bayi panelindeki ürün kutularına yerleştirilen adet + sepete ekle
 * bileşeni. Adet girişi yerel state'te tutulur; "Sepete Ekle" tıklanınca global
 * sepete (CartProvider) eklenir ve sepet çekmecesi açılır.
 */
export default function AddToCartButton({
  product,
}: {
  product: AddToCartProduct;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      boxCode: product.box_code,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="mt-auto pt-4">
      <div className="flex items-center gap-2">
        {/* Adet seçici */}
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-9 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            aria-label="Adedi azalt"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))
            }
            className="w-12 h-9 text-center border-x border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none"
            aria-label="Adet"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-8 h-9 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            aria-label="Adedi artır"
          >
            +
          </button>
        </div>

        {/* Ekle butonu */}
        <button
          type="button"
          onClick={handleAdd}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
            added
              ? "bg-green-600 text-white focus-visible:ring-green-400"
              : "bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-400"
          }`}
        >
          {added ? "Eklendi ✓" : "Sepete Ekle"}
        </button>
      </div>
    </div>
  );
}
