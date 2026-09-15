/**
 * UI / etki alanı (domain) tipleri.
 *
 * Supabase tabloları (bkz. `./database.ts`) ile bileşenler arasında kullanılan,
 * genellikle JOIN sonucu zenginleştirilmiş satır şekillerini tanımlar.
 */

import type { CategoryRow, ProductRow } from "./database";

/** Ana sayfa / kategori gridinde gösterilen kategori özeti. */
export type Category = Pick<CategoryRow, "id" | "name" | "prefix">;

/** Bayi panelinde listelenen ürün özeti. */
export type ProductSummary = Pick<
  ProductRow,
  "id" | "name" | "box_code" | "category_id"
>;

/** Admin ürün listesi satırı (kategori adı JS seviyesinde eklenir). */
export type AdminProductRow = {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  categories: { name: string };
};

/** Admin model listesi satırı. */
export type AdminModelRow = {
  id: string;
  model_name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  product_id: number;
  sort_order: number;
  created_at: string | null;
  products: { name: string } | null;
};

/** Arama çubuğu sonuç satırı. */
export type SearchResult = {
  id: string;
  model_name: string;
  product_id: number;
  product_name: string;
  box_code: string | null;
  category_id: number;
  category_name: string;
};

/** Bayi sepetinde tutulan satır (client-side cart state). */
export type CartItem = {
  productId: number;
  name: string;
  boxCode: string | null;
  quantity: number;
  unitPrice: number;
};

/** Admin sipariş listesindeki kalem (order_items + products join). */
export type AdminOrderItem = {
  id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  products: { name: string; box_code: string | null } | null;
};

/** Admin sipariş listesindeki sipariş başlığı (orders + organizations join). */
export type AdminOrderRow = {
  id: string;
  status: string;
  total_amount: number;
  note: string | null;
  created_at: string;
  organizations: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  order_items: AdminOrderItem[];
};

