"use client";

import { useEffect, useState } from "react";
import { Badge, Card, methodColor, statusColor, JsonBlock } from "@/components/ui";
import type { RequestLog } from "@/lib/types";

const METHODS = ["GET", "POST", "PUT", "DELETE"];
const STATUSES = ["200", "201", "400", "401", "404", "500"];

export default function RequestsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<RequestLog | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (method) params.set("method", method);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/logs?${params.toString()}`, { cache: "no-store" });
    setLogs(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount + polling
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, status, q]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Inspetor de Requisições</h1>
        <p className="text-sm text-text-muted mt-1">Todas as requisições recebidas em /wp-json/wc/v3/ em tempo real.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setMethod("")} className={`px-2.5 py-1 rounded text-xs border ${method === "" ? "border-blue text-blue" : "border-border text-text-muted"}`}>Todos</button>
        {METHODS.map((m) => (
          <button key={m} onClick={() => setMethod(m)} className={`px-2.5 py-1 rounded text-xs border ${method === m ? "border-blue text-blue" : "border-border text-text-muted"}`}>{m}</button>
        ))}
        <span className="w-px h-4 bg-border mx-1" />
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(status === s ? "" : s)} className={`px-2.5 py-1 rounded text-xs border ${status === s ? "border-blue text-blue" : "border-border text-text-muted"}`}>{s}</button>
        ))}
        <input
          className="ml-auto bg-black/20 border border-border rounded-md px-3 py-1.5 text-xs w-56"
          placeholder="Buscar por path (products, orders...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-4 py-2">Método</th>
                <th className="px-4 py-2">Caminho</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Duração</th>
                <th className="px-4 py-2">Horário</th>
                <th className="px-4 py-2">Chave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="cursor-pointer hover:bg-white/5" onClick={() => setSelected(l)}>
                  <td className="px-4 py-2"><Badge color={methodColor(l.method)}>{l.method}</Badge></td>
                  <td className="px-4 py-2 mono text-xs">{l.path}</td>
                  <td className="px-4 py-2"><Badge color={statusColor(l.response_status)}>{l.response_status}</Badge></td>
                  <td className="px-4 py-2 mono text-xs">{l.duration_ms}ms</td>
                  <td className="px-4 py-2 text-xs text-text-muted">{new Date(l.created_at).toLocaleTimeString("pt-BR")}</td>
                  <td className="px-4 py-2 mono text-xs text-text-muted">{l.consumer_key ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Nenhuma requisição registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-surface border-l border-border h-full overflow-y-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold mono text-sm">{selected.method} {selected.path}</h2>
              <button className="text-text-muted" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>Recebida → Autenticada → Processada → Respondida</span>
            </div>

            <div className="flex items-center gap-3">
              <Badge color={statusColor(selected.response_status)}>{selected.response_status}</Badge>
              <span className="mono text-xs text-text-muted">{selected.duration_ms}ms</span>
              <span className="text-xs text-text-muted">{new Date(selected.created_at).toLocaleString("pt-BR")}</span>
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Parâmetros de Query</div>
              <JsonBlock data={selected.query_params} />
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Cabeçalhos</div>
              <JsonBlock data={selected.headers} />
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Corpo da Requisição</div>
              <JsonBlock data={selected.request_body} />
            </div>

            <div>
              <div className="text-xs text-text-muted mb-1">Corpo da Resposta</div>
              <JsonBlock data={selected.response_body} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
