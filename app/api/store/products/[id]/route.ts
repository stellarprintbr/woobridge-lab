import { NextResponse } from "next/server";
import { getProduct, updateProduct, deleteProduct } from "@/lib/repo";
import { dispatchEvent } from "@/lib/webhooks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const product = await updateProduct(Number(id), payload);
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  dispatchEvent("product.updated", product);
  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const removed = await deleteProduct(Number(id));
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  dispatchEvent("product.deleted", removed);
  return NextResponse.json({ ok: true });
}
