"use client";

import { useState } from "react";
import { Card, CardHeader, Badge, Button, JsonBlock, statusColor } from "@/components/ui";
import { DEMO_CREDENTIAL as DEMO_CRED } from "@/lib/demo-credential";

const ACTIONS = [
  { id: "get_products", label: "GET products", method: "GET", path: "/wp-json/wc/v3/products?per_page=5" },
  { id: "get_orders", label: "GET orders", method: "GET", path: "/wp-json/wc/v3/orders?per_page=5" },
  { id: "get_customers", label: "GET customers", method: "GET", path: "/wp-json/wc/v3/customers?per_page=5" },
  { id: "post_order", label: "POST order", method: "POST", path: "/wp-json/wc/v3/orders" },
];

interface Step {
  label: string;
  detail: string;
}

export default function ErpSimulatorPage() {
  const [ck, setCk] = useState(DEMO_CRED.key);
  const [cs, setCs] = useState(DEMO_CRED.secret);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<{ status: number; body: unknown } | null>(null);

  async function run(action: typeof ACTIONS[number]) {
    setRunning(true);
    setResult(null);
    setSteps([{ label: "Requisição do ERP", detail: `${action.method} ${action.path}` }]);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ck && cs) headers["Authorization"] = `Basic ${btoa(`${ck}:${cs}`)}`;

    let body: string | undefined;
    if (action.id === "post_order") {
      body = JSON.stringify({
        payment_method: "pix",
        payment_method_title: "PIX",
        customer_id: 1,
        billing: { first_name: "ERP", last_name: "Simulado", email: "erp@example.com.br", address_1: "Rua Teste", city: "São Paulo", state: "SP", postcode: "01000-000", country: "BR" },
        line_items: [],
      });
    }

    setSteps((s) => [...s, { label: "API", detail: "Autenticando e processando..." }]);
    try {
      const res = await fetch(action.path, { method: action.method, headers, body });
      const responseBody = await res.json().catch(() => null);
      setSteps((s) => [...s, { label: "Resposta", detail: `HTTP ${res.status}` }, { label: "Log", detail: "Requisição registrada no Inspetor de Requisições" }]);
      setResult({ status: res.status, body: responseBody });
    } catch (err) {
      setSteps((s) => [...s, { label: "Error", detail: (err as Error).message }]);
    }
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Simulador de ERP</h1>
        <p className="text-sm text-text-muted mt-1">Simula um ERP externo consumindo a API pública via HTTP real.</p>
      </div>

      <Card>
        <CardHeader title="Credenciais do ERP" />
        <div className="p-5 grid grid-cols-2 gap-3">
          <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm mono" placeholder="Consumer Key" value={ck} onChange={(e) => setCk(e.target.value)} />
          <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm mono" placeholder="Consumer Secret" value={cs} onChange={(e) => setCs(e.target.value)} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Ações disponíveis" />
        <div className="p-5 flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <Button key={a.id} variant="secondary" disabled={running} onClick={() => run(a)}>
              {a.label}
            </Button>
          ))}
        </div>
      </Card>

      {steps.length > 0 && (
        <Card>
          <CardHeader title="Fluxo" />
          <div className="p-5 flex items-center gap-3 flex-wrap text-xs">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="border border-border rounded-md px-3 py-1.5">
                  <div className="font-medium text-text">{s.label}</div>
                  <div className="text-text-muted mono">{s.detail}</div>
                </div>
                {i < steps.length - 1 && <span className="text-text-muted">→</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader title="Resultado" action={<Badge color={statusColor(result.status)}>{result.status}</Badge>} />
          <div className="p-5">
            <JsonBlock data={result.body} />
          </div>
        </Card>
      )}
    </div>
  );
}
