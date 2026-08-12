"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Badge } from "@/components/ui";

export default function ApiStatusPage() {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    async function check() {
      const start = Date.now();
      await fetch("/api/stats", { cache: "no-store" });
      setLatency(Date.now() - start);
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { name: "API", status: "online" },
    { name: "Banco de dados (armazenamento JSON em memória)", status: "online" },
    { name: "Autenticação", status: "online" },
    { name: "Disparador de Webhooks", status: "online" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Status da API</h1>
        <p className="text-sm text-text-muted mt-1">Saúde dos componentes do WooBridge Lab.</p>
      </div>

      <Card>
        <CardHeader title="Componentes" action={<span className="mono text-xs text-text-muted">latência: {latency ?? "…"}ms</span>} />
        <div className="divide-y divide-border">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{s.name}</span>
              <Badge color="green">● online</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 text-xs text-text-muted">
        Nota: este laboratório usa dados em memória (sem persistência real em banco). Os dados são resetados quando o servidor reinicia — use isso apenas para testar o contrato de conexão do ERP.
      </Card>
    </div>
  );
}
