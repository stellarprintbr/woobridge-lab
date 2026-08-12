import { wooRoute } from "@/lib/route-handler";
import { db } from "@/lib/db";
import { isoNow, money } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const product = db.products.find((p) => p.id === id);
  if (!product) throw Errors.invalidId("product");
  return { status: 200, body: product };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const product = db.products.find((p) => p.id === id);
  if (!product) throw Errors.invalidId("product");

  const payload = await req.json().catch(() => ({}));
  Object.assign(product, payload);
  if (payload.regular_price !== undefined) product.regular_price = money(parseFloat(payload.regular_price) || 0);
  if (payload.sale_price !== undefined) product.price = payload.sale_price || product.regular_price;
  else if (payload.regular_price !== undefined) product.price = product.regular_price;
  product.date_modified = isoNow();

  dispatchEvent("product.updated", product);
  return { status: 200, body: product };
});

export const DELETE = wooRoute("write", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) throw Errors.invalidId("product");
  const [removed] = db.products.splice(idx, 1);
  dispatchEvent("product.deleted", removed);
  return { status: 200, body: removed };
});
