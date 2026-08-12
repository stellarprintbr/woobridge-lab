import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isoNow } from "@/lib/format";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const webhook = db.webhooks.find((w) => w.id === Number(id));
  if (!webhook) return NextResponse.json({ error: "not found" }, { status: 404 });
  const deliveries = db.webhookDeliveries.filter((d) => d.webhook_id === webhook.id);
  return NextResponse.json({ ...webhook, deliveries });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const webhook = db.webhooks.find((w) => w.id === Number(id));
  if (!webhook) return NextResponse.json({ error: "not found" }, { status: 404 });
  const payload = await req.json().catch(() => ({}));
  Object.assign(webhook, payload);
  webhook.date_modified = isoNow();
  return NextResponse.json(webhook);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idx = db.webhooks.findIndex((w) => w.id === Number(id));
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  db.webhooks.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
