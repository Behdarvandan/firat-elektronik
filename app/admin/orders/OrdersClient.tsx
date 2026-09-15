"use client";

import { useState } from "react";
import type { AdminOrderRow } from "@/types/catalog";
import { updateOrderStatusAction, ORDER_STATUSES } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  processing: "Hazırlanıyor",
  shipped: "Kargolandı",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  processing: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  shipped: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

function formatPrice(value: number): string {
  return `₺${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: AdminOrderRow[];
}) {
  const [orders, setOrders] = useState<AdminOrderRow[]>(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleStatusChange(orderId: string, status: string) {
    setUpdatingId(orderId);
    setFeedback(null);
    const result = await updateOrderStatusAction(orderId, status);
    setUpdatingId(null);

    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      setFeedback({ type: "success", text: "Sipariş durumu güncellendi." });
    } else {
      setFeedback({
        type: "error",
        text: result.error ?? "Güncelleme başarısız oldu.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <p className="text-slate-400">Henüz sipariş bulunmuyor.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
          >
            {/* Başlık */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-semibold text-white truncate">
                    {order.organizations?.name ?? "Bilinmeyen Bayi"}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      STATUS_BADGE[order.status] ?? STATUS_BADGE.pending
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {order.organizations?.email ?? "—"}
                  {order.organizations?.phone
                    ? ` · ${order.organizations.phone}`
                    : ""}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Sipariş No: {order.id.slice(0, 8)} ·{" "}
                  {formatDate(order.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor={`status-${order.id}`}
                  className="text-sm text-slate-400"
                >
                  Durum:
                </label>
                <select
                  id={`status-${order.id}`}
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kalemler */}
            <div className="p-5">
              <ul className="space-y-2">
                {order.order_items?.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-slate-200 font-medium truncate">
                        {item.products?.name ?? `Ürün #${item.product_id}`}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.products?.box_code ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <span className="text-slate-400">{item.quantity} adet</span>
                      <span className="text-slate-400">
                        × {formatPrice(item.unit_price)}
                      </span>
                      <span className="text-slate-200 font-semibold w-24 text-right">
                        {formatPrice(item.quantity * item.unit_price)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {order.note && (
                <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                  <span className="text-slate-400 font-medium">Not:</span>{" "}
                  {order.note}
                </div>
              )}
            </div>

            {/* Alt bilgi */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800/40 border-t border-slate-800">
              <span className="text-slate-400 text-sm">
                {order.order_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0}{" "}
                kalem
              </span>
              <span className="text-white font-bold text-lg">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
