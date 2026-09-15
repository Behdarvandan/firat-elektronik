import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminOrderRow } from "@/types/catalog";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

// Siparişler RLS ile korunduğu ve anon client'a politikasız olduğu için
// okuma işlemi SERVICE ROLE key kullanan supabaseAdmin ile yapılır.
async function getOrders(): Promise<AdminOrderRow[]> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      status,
      total_amount,
      note,
      created_at,
      organizations (name, email, phone),
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        products (name, box_code)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Siparişler yüklenemedi:", error);
    return [];
  }

  return (data as AdminOrderRow[]) ?? [];
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
          Sipariş Yönetimi
        </h1>
        <p className="text-slate-400 text-sm md:text-lg">
          Bayi siparişlerini görüntüleyin ve durumlarını güncelleyin
        </p>
      </div>

      <OrdersClient initialOrders={orders} />
    </div>
  );
}
