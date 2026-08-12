import { wooRoute } from "@/lib/route-handler";
import { db } from "@/lib/db";
import { isoNow } from "@/lib/format";
import { Errors } from "@/lib/errors";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const webhook = db.webhooks.find((w) => w.id === id);
  if (!webhook) throw Errors.invalidId("webhook");
  return { status: 200, body: webhook };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const webhook = db.webhooks.find((w) => w.id === id);
  if (!webhook) throw Errors.invalidId("webhook");
  const payload = await req.json().catch(() => ({}));
  Object.assign(webhook, payload);
  webhook.date_modified = isoNow();
  return { status: 200, body: webhook };
});

export const DELETE = wooRoute("write", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const idx = db.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) throw Errors.invalidId("webhook");
  const [removed] = db.webhooks.splice(idx, 1);
  return { status: 200, body: removed };
});
