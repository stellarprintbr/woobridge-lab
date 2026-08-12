"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

type StepStatus = "idle" | "running" | "done" | "error";

interface StepState {
  status: StepStatus;
  detail?: string;
}

export default function WizardPage() {
  const [seedState, setSeedState] = useState<StepState>({ status: "idle" });
  const [credState, setCredState] = useState<StepState>({ status: "idle" });
  const [cred, setCred] = useState<{ key: string; secret: string } | null>(null);
  const [testState, setTestState] = useState<StepState>({ status: "idle" });
  const [webhookState, setWebhookState] = useState<StepState>({ status: "idle" });
  const [orderState, setOrderState] = useState<StepState>({ status: "idle" });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://SEU-DOMINIO";

  async function stepSeed() {
    setSeedState({ status: "running" });
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setSeedState({ status: "done", detail: `${data.summary.products} produtos, ${data.summary.customers} clientes, ${data.summary.orders} pedidos, ${data.summary.webhooks} webhooks` });
  }

  async function stepCredential() {
    setCredState({ status: "running" });
    // Usa a primeira das 5 credenciais fixas do laboratório em vez de gerar uma nova —
    // essas chaves são hardcoded e nunca mudam entre deploys/reinícios.
    const res = await fetch("/api/credentials", { cache: "no-store" });
    const list = await res.json();
    const fixed = list.find((c: { fixed: boolean }) => c.fixed) ?? list[0];
    setCred({ key: fixed.key, secret: fixed.secretPreview });
    setCredState({ status: "done", detail: fixed.key });
  }

  async function stepTest() {
    if (!cred) return;
    setTestState({ status: "running" });
    const res = await fetch("/api/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cred),
    });
    const data = await res.json();
    setTestState({ status: data.ok ? "done" : "error", detail: `${data.message} (${data.duration_ms}ms)` });
  }

  async function stepWebhook() {
    if (!cred) return;
    setWebhookState({ status: "running" });
    const auth = `Basic ${btoa(`${cred.key}:${cred.secret}`)}`;
    const res = await fetch("/wp-json/wc/v3/webhooks", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Wizard Webhook", topic: "order.created", delivery_url: "https://webhook.site/wizard-demo" }),
    });
    const data = await res.json();
    setWebhookState({ status: res.ok ? "done" : "error", detail: res.ok ? `webhook #${data.id} criado` : data.message });
  }

  async function stepOrder() {
    if (!cred) return;
    setOrderState({ status: "running" });
    const auth = `Basic ${btoa(`${cred.key}:${cred.secret}`)}`;
    const productsRes = await fetch("/wp-json/wc/v3/products?per_page=1", { headers: { Authorization: auth } });
    const products = await productsRes.json();
    const res = await fetch("/wp-json/wc/v3/orders", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_method: "pix",
        payment_method_title: "PIX",
        customer_id: 1,
        billing: { first_name: "Wizard", last_name: "Demo", email: "wizard@example.com.br", address_1: "Rua Demo", city: "São Paulo", state: "SP", postcode: "01000-000", country: "BR" },
        line_items: products[0] ? [{ product_id: products[0].id, quantity: 1 }] : [],
      }),
    });
    const data = await res.json();
    setOrderState({ status: res.ok ? "done" : "error", detail: res.ok ? `pedido #${data.number} criado` : data.message });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Assistente de Configuração</h1>
        <p className="text-sm text-text-muted mt-1">Passo a passo para configurar e validar o laboratório de ponta a ponta.</p>
      </div>

      <Step
        number={1}
        title="Popular dados demo"
        description="Cria 10 produtos, 5 variáveis, 20 clientes, 30 pedidos e 5 webhooks de exemplo com dados brasileiros."
        state={seedState}
        action={<Button onClick={stepSeed} disabled={seedState.status === "running"}>Popular dados demo</Button>}
      />

      <Step
        number={2}
        title="Gerar credenciais"
        description="Cria um par Consumer Key / Consumer Secret para autenticar requisições."
        state={credState}
        action={<Button onClick={stepCredential} disabled={credState.status === "running"}>Gerar credencial</Button>}
      >
        {cred && (
          <div className="mono text-xs bg-black/30 border border-border rounded-md p-3 mt-2 space-y-1">
            <div>Key: <span className="text-text">{cred.key}</span></div>
            <div>Secret: <span className="text-green">{cred.secret}</span></div>
          </div>
        )}
      </Step>

      <Step
        number={3}
        title="URL da API"
        description="Endpoint base que o ERP deve apontar."
        state={{ status: "done" }}
      >
        <div className="mono text-xs bg-black/30 border border-border rounded-md p-3 mt-2 flex items-center justify-between">
          <span>{origin}/wp-json/wc/v3/</span>
          <button className="text-blue text-xs" onClick={() => navigator.clipboard.writeText(`${origin}/wp-json/wc/v3/`)}>copy</button>
        </div>
      </Step>

      <Step
        number={4}
        title="Testar conexão"
        description="Executa GET /wp-json/wc/v3/products com as credenciais geradas."
        state={testState}
        action={<Button onClick={stepTest} disabled={!cred || testState.status === "running"}>Testar conexão</Button>}
      />

      <Step
        number={5}
        title="Criar webhook"
        description="Registra um webhook para o evento order.created."
        state={webhookState}
        action={<Button onClick={stepWebhook} disabled={!cred || webhookState.status === "running"}>Criar webhook</Button>}
      />

      <Step
        number={6}
        title="Criar um pedido de teste"
        description="Simula o ERP criando um pedido real via POST /wp-json/wc/v3/orders — dispara o webhook do passo anterior."
        state={orderState}
        action={<Button onClick={stepOrder} disabled={!cred || orderState.status === "running"}>Criar pedido</Button>}
      />

      <Card>
        <CardHeader title="Próximos passos" />
        <div className="p-5 text-sm space-y-2">
          <p className="text-text-muted">
            Configure o seu ERP para apontar para a URL da API com as credenciais geradas. Depois acompanhe as
            requisições chegando em tempo real:
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard/requests" className="text-blue hover:underline">Request Inspector →</Link>
            <Link href="/dashboard/webhooks" className="text-blue hover:underline">Webhooks →</Link>
            <Link href="/dashboard/tests" className="text-blue hover:underline">Compatibility Tests →</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  state,
  action,
  children,
}: {
  number: number;
  title: string;
  description: string;
  state: StepState;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 border ${
              state.status === "done"
                ? "bg-green/10 border-green/40 text-green"
                : state.status === "error"
                ? "bg-red/10 border-red/40 text-red"
                : "bg-white/5 border-border text-text-muted"
            }`}
          >
            {state.status === "done" ? "✓" : number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">{title}</h3>
              {action}
            </div>
            <p className="text-xs text-text-muted mt-1">{description}</p>
            {state.detail && (
              <div className="mt-2">
                <Badge color={state.status === "error" ? "red" : "green"}>{state.detail}</Badge>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}
