"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Button, JsonBlock } from "@/components/ui";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewJson, setViewJson] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", regular_price: "", stock_quantity: "" });

  async function load() {
    const res = await fetch("/api/store/products", { cache: "no-store" });
    setProducts(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function create() {
    await fetch("/api/store/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, stock_quantity: Number(form.stock_quantity) || 0 }),
    });
    setForm({ name: "", sku: "", regular_price: "", stock_quantity: "" });
    setShowForm(false);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Excluir este produto?")) return;
    await fetch(`/api/store/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-text-muted mt-1">Gerenciar produtos da loja de teste.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancelar" : "Novo produto"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Novo produto" />
          <div className="p-5 grid grid-cols-2 gap-3">
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Preço regular" value={form.regular_price} onChange={(e) => setForm({ ...form, regular_price: e.target.value })} />
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Estoque" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
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
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Preço</th>
                <th className="px-4 py-2">Estoque</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Atualizado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 mono text-text-muted">{p.id}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 mono text-xs">{p.sku}</td>
                  <td className="px-4 py-2 mono">R$ {p.price}</td>
                  <td className="px-4 py-2">{p.stock_quantity ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Badge color={p.status === "publish" ? "green" : "gray"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-text-muted">{new Date(p.date_modified).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <button className="text-blue hover:underline text-xs" onClick={() => setViewJson(p)}>JSON</button>
                    <button className="text-red hover:underline text-xs" onClick={() => remove(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    Nenhum produto. Use &quot;Novo produto&quot; ou o Assistente de Configuração para popular dados demo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {viewJson && (
        <Card>
          <CardHeader title={`Produto #${viewJson.id} — JSON`} action={<button className="text-xs text-text-muted" onClick={() => setViewJson(null)}>fechar</button>} />
          <div className="p-4">
            <JsonBlock data={viewJson} />
          </div>
        </Card>
      )}
    </div>
  );
}
