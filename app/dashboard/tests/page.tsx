"use client";

import { useState } from "react";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

interface TestCase {
  name: string;
  run: (auth: string) => Promise<boolean>;
}

interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
}

function buildTests(): TestCase[] {
  return [
    {
      name: "Autenticação com credenciais válidas",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/products?per_page=1", { headers: { Authorization: auth } });
        return res.status === 200;
      },
    },
    {
      name: "Autenticação com credenciais inválidas",
      run: async () => {
        const res = await fetch("/wp-json/wc/v3/products?per_page=1", { headers: { Authorization: "Basic aW52YWxpZDppbnZhbGlk" } });
        return res.status === 401;
      },
    },
    {
      name: "GET products retorna array",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/products", { headers: { Authorization: auth } });
        const body = await res.json();
        return res.status === 200 && Array.isArray(body);
      },
    },
    {
      name: "POST product cria recurso",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/products", {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Teste Automático", regular_price: "10.00" }),
        });
        return res.status === 201;
      },
    },
    {
      name: "GET orders retorna array",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/orders", { headers: { Authorization: auth } });
        const body = await res.json();
        return res.status === 200 && Array.isArray(body);
      },
    },
    {
      name: "GET customers retorna array",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/customers", { headers: { Authorization: auth } });
        const body = await res.json();
        return res.status === 200 && Array.isArray(body);
      },
    },
    {
      name: "Paginação — cabeçalho X-WP-Total presente",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/products?per_page=1", { headers: { Authorization: auth } });
        return res.headers.get("X-WP-Total") !== null;
      },
    },
    {
      name: "ID de produto inválido retorna 404",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/products/999999999", { headers: { Authorization: auth } });
        return res.status === 404;
      },
    },
    {
      name: "Criação de webhook",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/webhooks", {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ topic: "order.created", delivery_url: "https://webhook.site/test-suite" }),
        });
        return res.status === 201;
      },
    },
    {
      name: "GET webhooks retorna array",
      run: async (auth) => {
        const res = await fetch("/wp-json/wc/v3/webhooks", { headers: { Authorization: auth } });
        const body = await res.json();
        return res.status === 200 && Array.isArray(body);
      },
    },
  ];
}

export default function TestsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults([]);

    const credRes = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Test Suite (auto)", permissions: "read_write" }),
    });
    const cred = await credRes.json();
    const auth = `Basic ${btoa(`${cred.key}:${cred.secret}`)}`;

    const tests = buildTests();
    for (const t of tests) {
      try {
        const pass = await t.run(auth);
        setResults((r) => [...r, { name: t.name, pass, detail: pass ? "OK" : "falha na verificação" }]);
      } catch (err) {
        setResults((r) => [...r, { name: t.name, pass: false, detail: (err as Error).message }]);
      }
    }
    setRunning(false);
  }

  const passed = results.filter((r) => r.pass).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Testes de Compatibilidade</h1>
          <p className="text-sm text-text-muted mt-1">Suíte automática que executa requisições HTTP reais contra a API.</p>
        </div>
        <Button onClick={runAll} disabled={running}>{running ? "Executando..." : "Rodar Todos os Testes"}</Button>
      </div>

      {results.length > 0 && (
        <Card className="p-4 flex items-center gap-3">
          <Badge color={passed === results.length ? "green" : "yellow"}>{passed}/{results.length} aprovados</Badge>
        </Card>
      )}

      <Card>
        <CardHeader title="Resultados" />
        <div className="divide-y divide-border">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <span className={r.pass ? "text-green" : "text-red"}>{r.pass ? "✓" : "✕"}</span>
                {r.name}
              </span>
              <span className="text-xs text-text-muted">{r.detail}</span>
            </div>
          ))}
          {results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-text-muted">Clique em &quot;Rodar Todos os Testes&quot; para começar.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
