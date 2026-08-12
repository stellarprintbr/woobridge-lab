"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Button } from "@/components/ui";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });

  async function load() {
    const res = await fetch("/api/store/customers", { cache: "no-store" });
    setCustomers(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function create() {
    await fetch("/api/store/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ email: "", first_name: "", last_name: "" });
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="text-sm text-text-muted mt-1">Clientes cadastrados na loja de teste.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancelar" : "Novo cliente"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Novo cliente" />
          <div className="p-5 grid grid-cols-3 gap-3">
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Nome" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Sobrenome" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Button onClick={create} className="col-span-3">Salvar</Button>
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
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Cidade</th>
                <th className="px-4 py-2">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 mono text-text-muted">{c.id}</td>
                  <td className="px-4 py-2">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-2 mono text-xs">{c.email}</td>
                  <td className="px-4 py-2 text-xs">{c.billing?.city ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-text-muted">{new Date(c.date_created).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">Nenhum cliente ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
