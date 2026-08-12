"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import type { WebhookTopic } from "@/lib/types";

const TOPICS: WebhookTopic[] = [
  "product.created",
  "product.updated",
  "product.deleted",
  "order.created",
  "order.updated",
  "order.deleted",
  "customer.created",
  "customer.updated",
  "customer.deleted",
];

interface WebhookRow {
  id: number;
  name: string;
  status: string;
  topic: string;
  delivery_url: string;
  last_delivery_at: string | null;
  success_rate: number | null;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", topic: TOPICS[0], delivery_url: "" });

  async function load() {
    const res = await fetch("/api/store/webhooks", { cache: "no-store" });
    setWebhooks(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount + polling
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function create() {
    await fetch("/api/store/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", topic: TOPICS[0], delivery_url: "" });
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Webhooks</h1>
          <p className="text-sm text-text-muted mt-1">Eventos disparados via HTTP POST assinado (HMAC-SHA256).</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancelar" : "Criar webhook"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Novo webhook" />
          <div className="p-5 grid grid-cols-2 gap-3">
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value as WebhookTopic })}>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm col-span-2" placeholder="Delivery URL (https://webhook.site/... por exemplo)" value={form.delivery_url} onChange={(e) => setForm({ ...form, delivery_url: e.target.value })} />
            <Button onClick={create} className="col-span-2">Salvar</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Tópico</th>
                <th className="px-4 py-2">URL</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Último envio</th>
                <th className="px-4 py-2">Taxa de sucesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {webhooks.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2 mono text-text-muted">
                    <Link href={`/dashboard/webhooks/${w.id}`} className="text-blue hover:underline">{w.id}</Link>
                  </td>
                  <td className="px-4 py-2 mono text-xs">{w.topic}</td>
                  <td className="px-4 py-2 mono text-xs truncate max-w-xs">{w.delivery_url}</td>
                  <td className="px-4 py-2"><Badge color={w.status === "active" ? "green" : "gray"}>{w.status}</Badge></td>
                  <td className="px-4 py-2 text-xs text-text-muted">{w.last_delivery_at ? new Date(w.last_delivery_at).toLocaleString("pt-BR") : "—"}</td>
                  <td className="px-4 py-2 text-xs">{w.success_rate !== null ? `${w.success_rate}%` : "—"}</td>
                </tr>
              ))}
              {webhooks.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Nenhum webhook configurado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
