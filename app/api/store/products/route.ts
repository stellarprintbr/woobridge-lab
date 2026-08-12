import { NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";
import { isoNow, money } from "@/lib/format";
import { dispatchEvent } from "@/lib/webhooks";
import type { Product } from "@/lib/types";

export async function GET() {
  return NextResponse.json([...db.products].sort((a, b) => b.id - a.id));
}

export async function POST(req: Request) {
  const payload: Partial<Product> = await req.json().catch(() => ({}));
  if (!payload.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const now = isoNow();
  const id = nextId("product");
  const regular = parseFloat(String(payload.regular_price ?? "0")) || 0;
  const sale = payload.sale_price ? parseFloat(String(payload.sale_price)) : null;
  const product: Product = {
    id,
    name: payload.name,
    slug: (payload.name as string).toLowerCase().replace(/\s+/g, "-"),
    type: payload.type ?? "simple",
    status: payload.status ?? "publish",
    sku: payload.sku ?? `SKU-${id}`,
    price: money(sale ?? regular),
    regular_price: money(regular),
    sale_price: sale !== null ? money(sale) : "",
    description: payload.description ?? "",
    short_description: payload.short_description ?? "",
    manage_stock: payload.manage_stock ?? true,
    stock_quantity: payload.stock_quantity ?? 0,
    stock_status: payload.stock_status ?? "instock",
    weight: payload.weight ?? "",
    length: "",
    width: "",
    height: "",
    virtual: false,
    downloadable: false,
    permalink: `https://woobridge.lab/produto/${id}`,
    categories: payload.categories ?? [],
    images: [],
    date_created: now,
    date_modified: now,
  };
  db.products.push(product);
  dispatchEvent("product.created", product);
  return NextResponse.json(product, { status: 201 });
}
