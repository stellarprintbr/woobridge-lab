import { wooRoute } from "@/lib/route-handler";
import { getProduct, updateProduct, deleteProduct } from "@/lib/repo";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const product = await getProduct(id);
  if (!product) throw Errors.invalidId("product");
  return { status: 200, body: product };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const payload = await req.json().catch(() => ({}));
  const product = await updateProduct(id, payload);
  if (!product) throw Errors.invalidId("product");

  dispatchEvent("product.updated", product);
  return { status: 200, body: product };
});

export const DELETE = wooRoute("write", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const removed = await deleteProduct(id);
  if (!removed) throw Errors.invalidId("product");
  dispatchEvent("product.deleted", removed);
  return { status: 200, body: removed };
});
