"use client";

import { useEffect, useState } from "react";
import { Card, Badge, orderStatusColor, JsonBlock } from "@/components/ui";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [selected, setSelected] = useState<Order | null>(null);

  async function load() {
    const res = await fetch("/api/store/orders", { cache: "no-store" });
    setOrders(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function updateStatus(order: Order, status: OrderStatus) {
    await fetch(`/api/store/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSelected(null);
    load();
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-text-muted mt-1">Pedidos da loja de teste.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("")} className={`px-2.5 py-1 rounded text-xs border ${filter === "" ? "border-blue text-blue" : "border-border text-text-muted"}`}>
          Todos
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded text-xs border ${filter === s ? "border-blue text-blue" : "border-border text-text-muted"}`}>
            {s}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Número</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-white/5" onClick={() => setSelected(o)}>
                  <td className="px-4 py-2 mono text-text-muted">{o.id}</td>
                  <td className="px-4 py-2 mono">#{o.number}</td>
                  <td className="px-4 py-2">{o.billing.first_name} {o.billing.last_name}</td>
                  <td className="px-4 py-2">
                    <Badge color={orderStatusColor(o.status)}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-2 mono">{o.currency_symbol} {o.total}</td>
                  <td className="px-4 py-2 text-xs text-text-muted">{new Date(o.date_created).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-surface border-l border-border h-full overflow-y-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Pedido #{selected.number}</h2>
              <button className="text-text-muted" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected, s)}
                  className={`px-2 py-1 rounded text-xs border ${selected.status === s ? "border-blue text-blue" : "border-border text-text-muted hover:text-text"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Cliente</div>
              <div className="text-sm">{selected.billing.first_name} {selected.billing.last_name}</div>
              <div className="text-xs text-text-muted mono">{selected.billing.email}</div>
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Cobrança</div>
              <div className="text-xs">{selected.billing.address_1}, {selected.billing.city} - {selected.billing.state}</div>
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Itens</div>
              <div className="space-y-1">
                {selected.line_items.map((li) => (
                  <div key={li.id} className="flex justify-between text-sm">
                    <span>{li.quantity}x {li.name}</span>
                    <span className="mono">R$ {li.total}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-text-muted">Pagamento</span>
              <span>{selected.payment_method_title || "—"}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Total</span>
              <span className="mono">{selected.currency_symbol} {selected.total}</span>
            </div>

            <JsonBlock data={selected} />
          </div>
        </div>
      )}
    </div>
  );
}
