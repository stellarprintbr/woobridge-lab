import { NextResponse } from "next/server";
import { getWebhook, updateWebhook, deleteWebhook, listWebhookDeliveries } from "@/lib/repo";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const webhook = await getWebhook(Number(id));
  if (!webhook) return NextResponse.json({ error: "not found" }, { status: 404 });
  const deliveries = await listWebhookDeliveries(webhook.id);
  return NextResponse.json({ ...webhook, deliveries });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const webhook = await updateWebhook(Number(id), payload);
  if (!webhook) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(webhook);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const removed = await deleteWebhook(Number(id));
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
