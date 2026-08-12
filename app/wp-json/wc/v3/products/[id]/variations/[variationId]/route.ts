import { wooRoute } from "@/lib/route-handler";
import { db } from "@/lib/db";
import { isoNow, money } from "@/lib/format";
import { Errors } from "@/lib/errors";

export const GET = wooRoute("read", async (_req, ctx) => {
  const productId = Number(ctx.params.id);
  const variationId = Number(ctx.params.variationId);
  const variation = db.variations.find((v) => v.id === variationId && v.product_id === productId);
  if (!variation) throw Errors.invalidId("product_variation");
  return { status: 200, body: variation };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const productId = Number(ctx.params.id);
  const variationId = Number(ctx.params.variationId);
  const variation = db.variations.find((v) => v.id === variationId && v.product_id === productId);
  if (!variation) throw Errors.invalidId("product_variation");

  const payload = await req.json().catch(() => ({}));
  Object.assign(variation, payload);
  if (payload.regular_price !== undefined) variation.regular_price = money(parseFloat(payload.regular_price) || 0);
  variation.date_modified = isoNow();
  return { status: 200, body: variation };
});
