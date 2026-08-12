"use client";

import { useState } from "react";
import { Card, CardHeader, Badge, Button, JsonBlock, statusColor } from "@/components/ui";
import { FIXED_CREDENTIAL_SEEDS } from "@/lib/fixtures";

const DEMO_CRED = FIXED_CREDENTIAL_SEEDS[0];

export default function PlaygroundPage() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/wp-json/wc/v3/products");
  const [ck, setCk] = useState(DEMO_CRED.key);
  const [cs, setCs] = useState(DEMO_CRED.secret);
  const [body, setBody] = useState('{\n  "name": "Produto Teste",\n  "sku": "TEST-001",\n  "regular_price": "100.00"\n}');
  const [result, setResult] = useState<{ status: number; headers: Record<string, string>; body: unknown; ms: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const start = Date.now();
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (ck && cs) headers["Authorization"] = `Basic ${btoa(`${ck}:${cs}`)}`;

      const res = await fetch(path, {
        method,
        headers,
        body: method === "GET" || method === "DELETE" ? undefined : body,
      });
      const responseBody = await res.json().catch(() => null);
      const headerObj: Record<string, string> = {};
      res.headers.forEach((v, k) => (headerObj[k] = v));
      setResult({ status: res.status, headers: headerObj, body: responseBody, ms: Date.now() - start });
    } catch (err) {
      setResult({ status: 0, headers: {}, body: { error: (err as Error).message }, ms: Date.now() - start });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Playground da API</h1>
        <p className="text-sm text-text-muted mt-1">Envia uma requisição HTTP real (fetch do navegador) contra a API pública.</p>
      </div>

      <Card>
        <CardHeader title="Requisição" />
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <select className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm w-28" value={method} onChange={(e) => setMethod(e.target.value)}>
              {["GET", "POST", "PUT", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input className="flex-1 bg-black/20 border border-border rounded-md px-3 py-2 text-sm mono" value={path} onChange={(e) => setPath(e.target.value)} />
            <Button onClick={send} disabled={loading}>{loading ? "Enviando..." : "Enviar"}</Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm mono" placeholder="Consumer Key (ck_...)" value={ck} onChange={(e) => setCk(e.target.value)} />
            <input className="bg-black/20 border border-border rounded-md px-3 py-2 text-sm mono" placeholder="Consumer Secret (cs_...)" value={cs} onChange={(e) => setCs(e.target.value)} />
          </div>

          {method !== "GET" && method !== "DELETE" && (
            <div>
              <div className="text-xs text-text-muted mb-1">Corpo (JSON)</div>
              <textarea
                className="w-full bg-black/20 border border-border rounded-md px-3 py-2 text-sm mono h-32"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {result && (
        <Card>
          <CardHeader
            title="Resposta"
            action={
              <div className="flex items-center gap-2">
                <Badge color={statusColor(result.status)}>{result.status || "ERRO"}</Badge>
                <span className="mono text-xs text-text-muted">{result.ms}ms</span>
              </div>
            }
          />
          <div className="p-5 space-y-3">
            <div>
              <div className="text-xs text-text-muted mb-1">Cabeçalhos da Resposta</div>
              <JsonBlock data={result.headers} />
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Corpo da Resposta</div>
              <JsonBlock data={result.body} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
