import { NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";
import { isoNow } from "@/lib/format";
import type { Webhook } from "@/lib/types";

export async function GET() {
  const withStats = db.webhooks
    .slice()
    .sort((a, b) => b.id - a.id)
    .map((w) => {
      const deliveries = db.webhookDeliveries.filter((d) => d.webhook_id === w.id);
      const last = deliveries[0];
      const success = deliveries.filter((d) => d.success).length;
      return {
        ...w,
        last_delivery_at: last?.created_at ?? null,
        success_rate: deliveries.length ? Math.round((success / deliveries.length) * 100) : null,
        delivery_count: deliveries.length,
      };
    });
  return NextResponse.json(withStats);
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  if (!payload.topic || !payload.delivery_url) {
    return NextResponse.json({ error: "topic and delivery_url are required" }, { status: 400 });
  }
  const now = isoNow();
  const id = nextId("webhook");
  const webhook: Webhook = {
    id,
    name: payload.name ?? `Webhook ${id}`,
    status: payload.status ?? "active",
    topic: payload.topic,
    delivery_url: payload.delivery_url,
    secret: payload.secret ?? `whsec_${Math.random().toString(36).slice(2)}`,
    date_created: now,
    date_modified: now,
  };
  db.webhooks.push(webhook);
  return NextResponse.json(webhook, { status: 201 });
}
