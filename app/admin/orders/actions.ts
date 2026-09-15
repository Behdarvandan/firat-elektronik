"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Migration'daki check kısıtıyla birebir aynı sıra (bkz. supabase/migrations).
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type UpdateOrderStatusResult = {
  success: boolean;
  error?: string;
};

/**
 * Bir siparişin durumunu günceller (örn. Onaylandı → Hazırlanıyor → Kargolandı).
 * Admin oturumu doğrulanır; geçersiz durum değerleri reddedilir.
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<UpdateOrderStatusResult> {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get("admin_session")?.value)) {
    return { success: false, error: "Yetkisiz erişim. Admin girişi gerekli." };
  }

  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { success: false, error: "Geçersiz sipariş durumu." };
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true };
}
