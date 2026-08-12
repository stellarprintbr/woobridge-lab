import { wooRoute } from "@/lib/route-handler";
import { getOrder, updateOrder, deleteOrder } from "@/lib/repo";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const order = await getOrder(id);
  if (!order) throw Errors.invalidId("order");
  return { status: 200, body: order };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const payload = await req.json().catch(() => ({}));
  const order = await updateOrder(id, payload);
  if (!order) throw Errors.invalidId("order");
  dispatchEvent("order.updated", order);
  return { status: 200, body: order };
});

export const DELETE = wooRoute("write", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const removed = await deleteOrder(id);
  if (!removed) throw Errors.invalidId("order");
  dispatchEvent("order.deleted", removed);
  return { status: 200, body: removed };
});
