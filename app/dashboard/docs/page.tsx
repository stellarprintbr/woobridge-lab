"use client";

import { useState } from "react";
import { Card, CardHeader, Badge, methodColor } from "@/components/ui";
import { FIXED_CREDENTIAL_SEEDS } from "@/lib/fixtures";

// Ambiente de teste: a chave usada nos exemplos é uma das 5 credenciais fixas do
// laboratório, exposta de propósito para copiar e colar direto (não é um segredo real).
const DEMO_CRED = FIXED_CREDENTIAL_SEEDS[0];

interface Endpoint {
  method: string;
  path: string;
  auth: string;
  query?: string[];
  body?: string;
  response: string;
  example: unknown;
}

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/wp-json/wc/v3/products", auth: "Basic Auth (read)", query: ["page", "per_page", "search", "sku", "status", "type", "category", "stock_status", "orderby", "order"], response: "200 OK — array de produtos + headers X-WP-Total / X-WP-TotalPages", example: [{ id: 1, name: "Camiseta Preta", sku: "CAM-001", price: "79.90", stock_status: "instock" }] },
  { method: "POST", path: "/wp-json/wc/v3/products", auth: "Basic Auth (write)", body: '{ "name": "Produto Teste", "sku": "TEST-001", "regular_price": "100.00" }', response: "201 Created — produto criado", example: { id: 11, name: "Produto Teste", sku: "TEST-001", price: "100.00" } },
  { method: "PUT", path: "/wp-json/wc/v3/products/{id}", auth: "Basic Auth (write)", body: '{ "stock_quantity": 42 }', response: "200 OK — produto atualizado", example: { id: 11, stock_quantity: 42 } },
  { method: "DELETE", path: "/wp-json/wc/v3/products/{id}", auth: "Basic Auth (write)", response: "200 OK — produto removido", example: { id: 11, name: "Produto Teste" } },
  { method: "GET", path: "/wp-json/wc/v3/products/{id}/variations", auth: "Basic Auth (read)", response: "200 OK — variações do produto", example: [{ id: 1, sku: "SKU-VAR-1-PR-P", price: "119.90" }] },
  { method: "GET", path: "/wp-json/wc/v3/orders", auth: "Basic Auth (read)", query: ["page", "per_page", "status", "customer", "after", "before", "search"], response: "200 OK — array de pedidos", example: [{ id: 1, number: "1001", status: "processing", total: "159.80" }] },
  { method: "POST", path: "/wp-json/wc/v3/orders", auth: "Basic Auth (write)", body: '{ "payment_method": "pix", "customer_id": 1, "line_items": [{ "product_id": 1, "quantity": 2 }] }', response: "201 Created — pedido criado", example: { id: 31, number: "1031", status: "pending" } },
  { method: "GET", path: "/wp-json/wc/v3/customers", auth: "Basic Auth (read)", query: ["page", "per_page", "email", "search"], response: "200 OK — array de clientes", example: [{ id: 1, email: "joao.silva1@example.com.br" }] },
  { method: "GET", path: "/wp-json/wc/v3/webhooks", auth: "Basic Auth (read)", response: "200 OK — array de webhooks", example: [{ id: 1, topic: "order.created", delivery_url: "https://webhook.site/..." }] },
  { method: "POST", path: "/wp-json/wc/v3/webhooks", auth: "Basic Auth (write)", body: '{ "topic": "order.created", "delivery_url": "https://seu-erp.com/hook" }', response: "201 Created — webhook criado", example: { id: 6, topic: "order.created" } },
];

export default function DocsPage() {
  const [selected, setSelected] = useState<Endpoint>(ENDPOINTS[0]);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://SEU-DOMINIO";

  const curl = `curl -X ${selected.method} \\\n"${origin}${selected.path}${selected.query ? "?per_page=10" : ""}" \\\n-u "${DEMO_CRED.key}:${DEMO_CRED.secret}"${selected.body ? ` \\\n-H "Content-Type: application/json" \\\n-d '${selected.body}'` : ""}`;

  const js = `const res = await fetch("${origin}${selected.path}", {\n  method: "${selected.method}",\n  headers: {\n    Authorization: "Basic " + btoa("${DEMO_CRED.key}:${DEMO_CRED.secret}"),${selected.body ? '\n    "Content-Type": "application/json",' : ""}\n  },${selected.body ? `\n  body: JSON.stringify(${selected.body}),` : ""}\n});\nconst data = await res.json();`;

  const php = `$response = wp_remote_${selected.method === "GET" ? "get" : "post"}(\n  "${origin}${selected.path}",\n  [\n    'headers' => ['Authorization' => 'Basic ' . base64_encode('${DEMO_CRED.key}:${DEMO_CRED.secret}')],${selected.body ? `\n    'body' => json_encode(${selected.body}),` : ""}\n  ]\n);`;

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 space-y-1">
        <h1 className="text-xl font-semibold mb-1">Documentação da API</h1>
        <p className="text-xs text-text-muted mb-3">
          Exemplos usam a credencial fixa <span className="mono">{DEMO_CRED.key}</span> — ambiente de teste, chave exposta de propósito.
        </p>
        {ENDPOINTS.map((e, i) => (
          <button
            key={i}
            onClick={() => setSelected(e)}
            className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2 ${selected === e ? "bg-white/10" : "hover:bg-white/5"}`}
          >
            <Badge color={methodColor(e.method)}>{e.method}</Badge>
            <span className="mono truncate">{e.path}</span>
          </button>
        ))}
      </div>

      <div className="col-span-2 space-y-4">
        <Card>
          <CardHeader title={`${selected.method} ${selected.path}`} subtitle={selected.auth} />
          <div className="p-5 space-y-4 text-sm">
            {selected.query && (
              <div>
                <div className="text-xs text-text-muted mb-1">Parâmetros de query</div>
                <div className="flex gap-1.5 flex-wrap">
                  {selected.query.map((q) => <Badge key={q} color="gray">{q}</Badge>)}
                </div>
              </div>
            )}
            {selected.body && (
              <div>
                <div className="text-xs text-text-muted mb-1">Corpo da requisição</div>
                <pre className="mono text-xs bg-black/30 border border-border rounded-md p-3 overflow-x-auto">{selected.body}</pre>
              </div>
            )}
            <div>
              <div className="text-xs text-text-muted mb-1">Resposta — {selected.response}</div>
              <pre className="mono text-xs bg-black/30 border border-border rounded-md p-3 overflow-x-auto">{JSON.stringify(selected.example, null, 2)}</pre>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="cURL" action={<CopyButton text={curl} />} />
          <pre className="mono text-xs p-4 overflow-x-auto text-text-muted">{curl}</pre>
        </Card>
        <Card>
          <CardHeader title="JavaScript" action={<CopyButton text={js} />} />
          <pre className="mono text-xs p-4 overflow-x-auto text-text-muted">{js}</pre>
        </Card>
        <Card>
          <CardHeader title="PHP" action={<CopyButton text={php} />} />
          <pre className="mono text-xs p-4 overflow-x-auto text-text-muted">{php}</pre>
        </Card>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-xs text-blue hover:underline"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "copiado!" : "copy"}
    </button>
  );
}
