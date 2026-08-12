import { wooRoute } from "@/lib/route-handler";
import { getWebhook, updateWebhook, deleteWebhook } from "@/lib/repo";
import { Errors } from "@/lib/errors";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const webhook = await getWebhook(id);
  if (!webhook) throw Errors.invalidId("webhook");
  return { status: 200, body: webhook };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const payload = await req.json().catch(() => ({}));
  const webhook = await updateWebhook(id, payload);
  if (!webhook) throw Errors.invalidId("webhook");
  return { status: 200, body: webhook };
});

export const DELETE = wooRoute("write", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const removed = await deleteWebhook(id);
  if (!removed) throw Errors.invalidId("webhook");
  return { status: 200, body: removed };
});
