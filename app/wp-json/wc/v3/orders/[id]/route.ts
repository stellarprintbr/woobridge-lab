import { wooRoute } from "@/lib/route-handler";
import { db } from "@/lib/db";
import { isoNow } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw Errors.invalidId("order");
  return { status: 200, body: order };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw Errors.invalidId("order");

  const payload = await req.json().catch(() => ({}));
  Object.assign(order, payload);
  order.date_modified = isoNow();
  dispatchEvent("order.updated", order);
  return { status: 200, body: order };
});

export const DELETE = wooRoute("write", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) throw Errors.invalidId("order");
  const [removed] = db.orders.splice(idx, 1);
  dispatchEvent("order.deleted", removed);
  return { status: 200, body: removed };
});
