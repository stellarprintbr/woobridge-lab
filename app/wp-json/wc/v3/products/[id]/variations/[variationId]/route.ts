import { wooRoute } from "@/lib/route-handler";
import { getVariation, updateVariation } from "@/lib/repo";
import { Errors } from "@/lib/errors";

export const GET = wooRoute("read", async (_req, ctx) => {
  const productId = Number(ctx.params.id);
  const variationId = Number(ctx.params.variationId);
  const variation = await getVariation(productId, variationId);
  if (!variation) throw Errors.invalidId("product_variation");
  return { status: 200, body: variation };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const productId = Number(ctx.params.id);
  const variationId = Number(ctx.params.variationId);
  const payload = await req.json().catch(() => ({}));
  const variation = await updateVariation(productId, variationId, payload);
  if (!variation) throw Errors.invalidId("product_variation");
  return { status: 200, body: variation };
});
