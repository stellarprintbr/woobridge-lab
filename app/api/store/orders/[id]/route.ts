import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/repo";
import { dispatchEvent } from "@/lib/webhooks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(Number(id));
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const order = await updateOrder(Number(id), payload);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  dispatchEvent("order.updated", order);
  return NextResponse.json(order);
}
