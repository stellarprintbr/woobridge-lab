import { NextResponse } from "next/server";
import { listWebhooks, listWebhookDeliveries, createWebhook } from "@/lib/repo";

export async function GET() {
  const [webhooks, deliveries] = await Promise.all([listWebhooks(), listWebhookDeliveries()]);
  const withStats = [...webhooks]
    .sort((a, b) => b.id - a.id)
    .map((w) => {
      const wDeliveries = deliveries.filter((d) => d.webhook_id === w.id);
      const last = wDeliveries[0];
      const success = wDeliveries.filter((d) => d.success).length;
      return {
        ...w,
        last_delivery_at: last?.created_at ?? null,
        success_rate: wDeliveries.length ? Math.round((success / wDeliveries.length) * 100) : null,
        delivery_count: wDeliveries.length,
      };
    });
  return NextResponse.json(withStats);
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  if (!payload.topic || !payload.delivery_url) {
    return NextResponse.json({ error: "topic and delivery_url are required" }, { status: 400 });
  }
  const webhook = await createWebhook(payload);
  return NextResponse.json(webhook, { status: 201 });
}
