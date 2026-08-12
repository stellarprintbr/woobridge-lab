"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge, methodColor, statusColor, Button } from "@/components/ui";

interface Stats {
  totalRequests: number;
  requestsToday: number;
  successful: number;
  failed: number;
  products: number;
  orders: number;
  customers: number;
  webhooks: number;
  avgLatency: number;
  p95Latency: number;
  webhookSuccessRate: number;
  recent: Array<{
    id: string;
    method: string;
    path: string;
    response_status: number;
    duration_ms: number;
    created_at: string;
  }>;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);

  async function load() {
    const res = await fetch("/api/stats", { cache: "no-store" });
    setStats(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount + polling
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">WooBridge Lab</h1>
          <p className="text-sm text-text-muted mt-1">Teste suas integrações compatíveis com WooCommerce.</p>
        </div>
        <Link href="/dashboard/wizard">
          <Button>Configuração Guiada</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total de Requisições" value={stats?.totalRequests ?? "—"} />
        <StatCard label="Requisições Hoje" value={stats?.requestsToday ?? "—"} />
        <StatCard label="Sucesso" value={stats?.successful ?? "—"} color="green" />
        <StatCard label="Falhas" value={stats?.failed ?? "—"} color="red" />
        <StatCard label="Produtos" value={stats?.products ?? "—"} href="/dashboard/products" />
        <StatCard label="Pedidos" value={stats?.orders ?? "—"} href="/dashboard/orders" />
        <StatCard label="Clientes" value={stats?.customers ?? "—"} href="/dashboard/customers" />
        <StatCard label="Webhooks" value={stats?.webhooks ?? "—"} href="/dashboard/webhooks" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-text-muted">Latência Média</div>
          <div className="text-2xl font-semibold mt-1">{stats?.avgLatency ?? 0}ms</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-muted">Latência P95</div>
          <div className="text-2xl font-semibold mt-1">{stats?.p95Latency ?? 0}ms</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-muted">Taxa de Sucesso de Webhooks</div>
          <div className="text-2xl font-semibold mt-1">{stats?.webhookSuccessRate ?? 100}%</div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Requisições Recentes"
          action={
            <Link href="/dashboard/requests" className="text-xs text-blue hover:underline">
              Ver todas →
            </Link>
          }
        />
        <div className="divide-y divide-border">
          {stats?.recent.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              Nenhuma requisição ainda. Gere credenciais e use o Playground.
            </div>
          )}
          {stats?.recent.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <Badge color={methodColor(r.method)}>{r.method}</Badge>
              <span className="mono text-text-muted flex-1 truncate">{r.path}</span>
              <Badge color={statusColor(r.response_status)}>{r.response_status}</Badge>
              <span className="mono text-xs text-text-muted w-14 text-right">{r.duration_ms}ms</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color, href }: { label: string; value: string | number; color?: "green" | "red"; href?: string }) {
  const content = (
    <Card className="p-4 hover:border-white/20 transition-colors h-full">
      <div className="text-xs text-text-muted">{label}</div>
      <div
        className="text-2xl font-semibold mt-1"
        style={{ color: color === "green" ? "var(--green)" : color === "red" ? "var(--red)" : undefined }}
      >
        {value}
      </div>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
