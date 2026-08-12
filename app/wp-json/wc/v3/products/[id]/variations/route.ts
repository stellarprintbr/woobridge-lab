import { wooRoute } from "@/lib/route-handler";
import { db, nextId } from "@/lib/db";
import { paginate, isoNow, money } from "@/lib/format";
import { Errors } from "@/lib/errors";
import type { ProductVariation } from "@/lib/types";

export const GET = wooRoute("read", async (_req, ctx) => {
  const productId = Number(ctx.params.id);
  const product = db.products.find((p) => p.id === productId);
  if (!product) throw Errors.invalidId("product");

  const items = db.variations.filter((v) => v.product_id === productId);
  const { slice, total, totalPages } = paginate(items, ctx.url.searchParams);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);
  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req, ctx) => {
  const productId = Number(ctx.params.id);
  const product = db.products.find((p) => p.id === productId);
  if (!product) throw Errors.invalidId("product");

  const payload = await req.json().catch(() => ({}));
  const now = isoNow();
  const id = nextId("variation");
  const variation: ProductVariation = {
    id,
    product_id: productId,
    sku: payload.sku ?? `${product.sku}-${id}`,
    price: payload.sale_price || payload.regular_price || "0.00",
    regular_price: money(parseFloat(payload.regular_price ?? "0") || 0),
    sale_price: payload.sale_price ?? "",
    stock_quantity: payload.stock_quantity ?? null,
    stock_status: payload.stock_status ?? "instock",
    attributes: payload.attributes ?? [],
    image: payload.image ?? null,
    weight: payload.weight ?? "",
    date_created: now,
    date_modified: now,
  };
  db.variations.push(variation);
  return { status: 201, body: variation };
});
