import { wooRoute } from "@/lib/route-handler";
import { getProduct, listVariations, createVariation } from "@/lib/repo";
import { paginate } from "@/lib/format";
import { Errors } from "@/lib/errors";

export const GET = wooRoute("read", async (_req, ctx) => {
  const productId = Number(ctx.params.id);
  const product = await getProduct(productId);
  if (!product) throw Errors.invalidId("product");

  const items = await listVariations(productId);
  const { slice, total, totalPages } = paginate(items, ctx.url.searchParams);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);
  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req, ctx) => {
  const productId = Number(ctx.params.id);
  const product = await getProduct(productId);
  if (!product) throw Errors.invalidId("product");

  const payload = await req.json().catch(() => ({}));
  const variation = await createVariation(productId, payload);
  return { status: 201, body: variation };
});
