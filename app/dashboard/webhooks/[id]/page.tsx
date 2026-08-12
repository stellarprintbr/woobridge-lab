"use client";

import { useEffect, useState, use } from "react";
import { Card, CardHeader, Badge } from "@/components/ui";
import type { Webhook, WebhookDelivery } from "@/lib/types";

export default function WebhookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<(Webhook & { deliveries: WebhookDelivery[] }) | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/store/webhooks/${id}`, { cache: "no-store" });
      setData(await res.json());
    }
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [id]);

  if (!data) return <div className="text-text-muted text-sm">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <p className="text-sm text-text-muted mt-1 mono">{data.topic} → {data.delivery_url}</p>
      </div>

      <Card>
        <CardHeader title="Histórico de Entregas" subtitle={`${data.deliveries.length} tentativas registradas`} />
        <div className="divide-y divide-border">
          {data.deliveries.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              Nenhuma entrega ainda. Dispare um evento (ex: crie um pedido) para este tópico.
            </div>
          )}
          {data.deliveries.map((d) => (
            <div key={d.id} className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tentativa #{d.attempt}</span>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-text-muted">{d.duration_ms}ms</span>
                  <Badge color={d.success ? "green" : "red"}>
                    {d.response_status ?? "ERRO"} {d.success ? "SUCESSO" : "FALHA"}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-text-muted">{new Date(d.created_at).toLocaleString("pt-BR")}</div>
              <details className="text-xs">
                <summary className="cursor-pointer text-blue">ver payload / resposta</summary>
                <pre className="mono bg-black/30 border border-border rounded-md p-3 mt-2 overflow-x-auto whitespace-pre-wrap">
                  {d.request_body}
                </pre>
                {d.response_body && (
                  <pre className="mono bg-black/30 border border-border rounded-md p-3 mt-2 overflow-x-auto whitespace-pre-wrap">
                    {d.response_body}
                  </pre>
                )}
              </details>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
