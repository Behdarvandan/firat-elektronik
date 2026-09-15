"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CartItem } from "@/types/catalog";

const STORAGE_KEY = "firat-elektronik-cart-v1";

// ---- localStorage destekli küçük dış store (useSyncExternalStore için) ----
// Sunucu/hidrasyon sırasında boş döner; gerçek sepet yalnızca istemci mount
// olduktan sonra yüklenir — böylece SSR/hidrasyon uyumsuzluğu oluşmaz.
let cachedItems: CartItem[] | null = null;
const listeners = new Set<() => void>();
const EMPTY_ITEMS: CartItem[] = [];

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSnapshot(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_ITEMS;
  return cachedItems ?? EMPTY_ITEMS;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_ITEMS;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function writeItems(items: CartItem[]) {
  cachedItems = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage dolu/erişilemezse yoksay
  }
  emit();
}

type AddCartItemInput = Omit<CartItem, "quantity" | "unitPrice"> & {
  quantity?: number;
  unitPrice?: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  // İlk istemci render'ından sonra localStorage'daki sepeti yükle.
  useEffect(() => {
    cachedItems = readStorage();
    emit();
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: AddCartItemInput) => {
    const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
    const prev = cachedItems ?? [];
    const existing = prev.find((l) => l.productId === item.productId);
    const next = existing
      ? prev.map((l) =>
          l.productId === item.productId
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        )
      : [
          ...prev,
          {
            productId: item.productId,
            name: item.name,
            boxCode: item.boxCode,
            quantity,
            unitPrice: item.unitPrice ?? 0,
          },
        ];
    writeItems(next);
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: number) => {
    const prev = cachedItems ?? [];
    writeItems(prev.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    const prev = cachedItems ?? [];
    writeItems(
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.floor(quantity)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => writeItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((sum, l) => sum + l.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      totalCount,
      totalAmount,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      totalCount,
      totalAmount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return ctx;
}
