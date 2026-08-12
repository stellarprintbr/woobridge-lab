import { NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/repo";
import { dispatchEvent } from "@/lib/webhooks";
import type { Product } from "@/lib/types";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json([...products].sort((a, b) => b.id - a.id));
}

export async function POST(req: Request) {
  const payload: Partial<Product> = await req.json().catch(() => ({}));
  if (!payload.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const product = await createProduct(payload as { name: string });
  dispatchEvent("product.created", product);
  return NextResponse.json(product, { status: 201 });
}
