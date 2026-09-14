"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin"; // Service role — RLS'i bypass eder
import {
  B2B_SESSION_COOKIE,
  B2B_SESSION_MAX_AGE,
  createB2bSessionToken,
  verifyB2bSessionToken,
} from "@/lib/b2b-session";

// ----------------------------------------------------------------------------
// Dealer (bayi) girişi
// ----------------------------------------------------------------------------
export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim();

  if (!email || !name) {
    return { error: "E-posta ve firma adı gereklidir" };
  }

  // İskelet akışı: e-posta ile bayi kaydını bul, yoksa otomatik oluştur.
  // Production'da bayiler önceden onaylanmalı ve Supabase Auth ile eşleşmelidir.
  const { data: existing, error: findError } = await supabaseAdmin
    .from("organizations")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    return { error: "Giriş sırasında bir hata oluştu" };
  }

  let organizationId = existing?.id;

  if (!existing) {
    const { data: created, error: createError } = await supabaseAdmin
      .from("organizations")
      .insert({ email, name })
      .select("id")
      .single();

    if (createError) {
      return { error: "Bayi kaydı oluşturulamadı" };
    }

    organizationId = created.id;
  }

  // İmzalı, süresi dolan bayi oturum token'ını cookie'ye yaz
  const cookieStore = await cookies();
  cookieStore.set(
    B2B_SESSION_COOKIE,
    createB2bSessionToken({
      organizationId: organizationId as string,
      email,
      name: existing?.name ?? name,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: B2B_SESSION_MAX_AGE,
      path: "/",
    },
  );

  // Bayi paneline yönlendir
  redirect("/b2b");
}

// ----------------------------------------------------------------------------
// Çıkış
// ----------------------------------------------------------------------------
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(B2B_SESSION_COOKIE);
  redirect("/b2b");
}

// ----------------------------------------------------------------------------
// Sipariş talebi oluşturma
// ----------------------------------------------------------------------------
export type OrderItemInput = {
  product_id: number;
  quantity: number;
  unit_price: number;
};

export type CreateOrderResult = {
  success: boolean;
  orderId?: string;
  error?: string;
};

export async function createOrderAction(
  items: OrderItemInput[],
): Promise<CreateOrderResult> {
  // Güvenlik: organization_id istemciden DEĞİL, doğrulanmış oturumdan gelir.
  const cookieStore = await cookies();
  const session = verifyB2bSessionToken(
    cookieStore.get(B2B_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
  }

  if (!items || items.length === 0) {
    return { success: false, error: "Sepet boş." };
  }

  // Aynı ürüne ait satırları birleştir (sunucuda tek satır, tutarlı toplam).
  const merged = new Map<
    number,
    { product_id: number; quantity: number; unit_price: number }
  >();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      continue; // Geçersiz miktarları sessizce yoksay
    }

    const existing = merged.get(item.product_id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(item.product_id, {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price) || 0,
      });
    }
  }

  const lines = Array.from(merged.values());
  if (lines.length === 0) {
    return { success: false, error: "Sepet boş." };
  }

  // NOT (güvenlik): Birim fiyat bu iskelette istemciden gelir. Production'da
  // birim fiyat MUTLAKA sunucuda güvenilir bir fiyat listesinden çekilmelidir.
  const totalAmount = lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0,
  );

  // 1) Sipariş başlığını oluştur
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      organization_id: session.organizationId,
      total_amount: totalAmount,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError) {
    return {
      success: false,
      error: `Sipariş oluşturulamadı: ${orderError.message}`,
    };
  }

  // 2) Sipariş kalemlerini ekle
  const orderItems = lines.map((l) => ({
    order_id: order.id,
    product_id: l.product_id,
    quantity: l.quantity,
    unit_price: l.unit_price,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return {
      success: false,
      error: `Sipariş kalemleri eklenemedi: ${itemsError.message}`,
    };
  }

  revalidatePath("/b2b");
  return { success: true, orderId: order.id };
}
