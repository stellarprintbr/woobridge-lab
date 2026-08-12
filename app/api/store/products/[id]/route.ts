import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isoNow, money } from "@/lib/format";
import { dispatchEvent } from "@/lib/webhooks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = db.products.find((p) => p.id === Number(id));
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = db.products.find((p) => p.id === Number(id));
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = await req.json().catch(() => ({}));
  Object.assign(product, payload);
  if (payload.regular_price !== undefined) product.regular_price = money(parseFloat(payload.regular_price) || 0);
  product.price = payload.sale_price ? money(parseFloat(payload.sale_price) || 0) : product.regular_price;
  product.date_modified = isoNow();
  dispatchEvent("product.updated", product);
  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idx = db.products.findIndex((p) => p.id === Number(id));
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  const [removed] = db.products.splice(idx, 1);
  dispatchEvent("product.deleted", removed);
  return NextResponse.json({ ok: true });
}
