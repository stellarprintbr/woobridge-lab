import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isoNow } from "@/lib/format";
import { dispatchEvent } from "@/lib/webhooks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = db.orders.find((o) => o.id === Number(id));
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = db.orders.find((o) => o.id === Number(id));
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = await req.json().catch(() => ({}));
  Object.assign(order, payload);
  order.date_modified = isoNow();
  dispatchEvent("order.updated", order);
  return NextResponse.json(order);
}
