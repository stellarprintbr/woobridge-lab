"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

interface Credential {
  id: string;
  key: string;
  secretPreview: string;
  permissions: string;
  description: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState("read_write");
  const [created, setCreated] = useState<{ key: string; secret: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/credentials", { cache: "no-store" });
    setCredentials(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, permissions }),
    });
    const data = await res.json();
    setCreated({ key: data.key, secret: data.secret });
    setDescription("");
    load();
  }

  async function revoke(id: string) {
    await fetch(`/api/credentials/${id}`, { method: "DELETE" });
    load();
  }

  async function testConnection(key: string) {
    setTesting(key);
    const secret = created?.key === key ? created.secret : prompt(`Cole o Consumer Secret completo para ${key} (não é armazenado em texto puro, então não pode ser recuperado)`);
    if (!secret) {
      setTesting(null);
      return;
    }
    const res = await fetch("/api/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, secret }),
    });
    const data = await res.json();
    setTestResult((prev) => ({ ...prev, [key]: `${data.ok ? "✓" : "✕"} ${data.message} (${data.duration_ms}ms)` }));
    setTesting(null);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://SEU-DOMINIO";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Credenciais da API</h1>
        <p className="text-sm text-text-muted mt-1">Gere Consumer Key / Consumer Secret para autenticar requisições em /wp-json/wc/v3/</p>
      </div>

      <Card>
        <CardHeader title="Nova credencial" />
        <div className="p-5 space-y-3">
          <input
            className="w-full bg-black/20 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-blue"
            placeholder="Descrição (ex: Bling ERP)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className="w-full bg-black/20 border border-border rounded-md px-3 py-2 text-sm outline-none"
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
          >
            <option value="read">read</option>
            <option value="write">write</option>
            <option value="read_write">read_write</option>
          </select>
          <Button onClick={create}>Gerar credencial</Button>
        </div>
      </Card>

      {created && (
        <Card className="border-green/40">
          <CardHeader title="Credencial criada — copie o secret agora, ele não será mostrado novamente" />
          <div className="p-5 space-y-2 mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-muted w-20">Key</span>
              <span className="text-text">{created.key}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted w-20">Secret</span>
              <span className="text-green">{created.secret}</span>
            </div>
            <pre className="bg-black/30 border border-border rounded-md p-3 mt-3 overflow-x-auto text-xs">
{`curl -X GET \\
"${origin}/wp-json/wc/v3/products" \\
-u "${created.key}:${created.secret}"`}
            </pre>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Credenciais existentes" />
        <div className="divide-y divide-border">
          {credentials.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-text-muted">Nenhuma credencial ainda.</div>
          )}
          {credentials.map((c) => (
            <div key={c.id} className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="mono text-sm">
                  {c.key} <span className="text-text-muted">/ {c.secretPreview}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="purple">{c.permissions}</Badge>
                  {c.revoked_at ? (
                    <Badge color="red">revogada</Badge>
                  ) : (
                    <Badge color="green">ativa</Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-text-muted flex items-center justify-between">
                <span>
                  {c.description || "sem descrição"} · criado {new Date(c.created_at).toLocaleString("pt-BR")}
                  {c.last_used_at && ` · último uso ${new Date(c.last_used_at).toLocaleString("pt-BR")}`}
                </span>
                <div className="flex items-center gap-3">
                  {testResult[c.key] && <span className="mono">{testResult[c.key]}</span>}
                  {!c.revoked_at && (
                    <>
                      <button
                        className="text-blue hover:underline disabled:opacity-50"
                        disabled={testing === c.key}
                        onClick={() => testConnection(c.key)}
                      >
                        Testar conexão
                      </button>
                      <button className="text-red hover:underline" onClick={() => revoke(c.id)}>
                        Revogar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
