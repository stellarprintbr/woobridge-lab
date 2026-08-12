"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, Badge, methodColor, statusColor } from "@/components/ui";
import type { RequestLog } from "@/lib/types";

export default function DebugPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    async function poll() {
      const res = await fetch("/api/logs?limit=50", { cache: "no-store" });
      const data: RequestLog[] = await res.json();
      if (!active) return;
      const fresh = data.filter((l) => !seen.current.has(l.id));
      fresh.forEach((l) => seen.current.add(l.id));
      if (fresh.length) setLogs((prev) => [...fresh.reverse(), ...prev].slice(0, 100));
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Console de Debug</h1>
        <p className="text-sm text-text-muted mt-1">Eventos em tempo real do sistema.</p>
      </div>

      <Card>
        <CardHeader title="Feed ao Vivo" />
        <div className="p-4 mono text-xs space-y-1.5 max-h-[70vh] overflow-y-auto">
          {logs.length === 0 && <div className="text-text-muted">Aguardando eventos...</div>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <span className="text-text-muted w-20">{new Date(l.created_at).toLocaleTimeString("pt-BR")}</span>
              <Badge color={methodColor(l.method)}>{l.method}</Badge>
              <span className="flex-1 truncate">{l.path}</span>
              <Badge color={statusColor(l.response_status)}>{l.response_status}</Badge>
              <span className="text-text-muted w-14 text-right">{l.duration_ms}ms</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
