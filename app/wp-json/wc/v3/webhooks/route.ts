import { wooRoute } from "@/lib/route-handler";
import { db, nextId } from "@/lib/db";
import { paginate, isoNow } from "@/lib/format";
import { Errors } from "@/lib/errors";
import type { Webhook } from "@/lib/types";

export const GET = wooRoute("read", async (_req, ctx) => {
  const { slice, total, totalPages } = paginate(db.webhooks, ctx.url.searchParams);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);
  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req) => {
  const payload = await req.json().catch(() => ({}));
  if (!payload.topic || !payload.delivery_url) {
    throw Errors.invalidParam({ topic: "topic and delivery_url are required" });
  }
  const now = isoNow();
  const id = nextId("webhook");
  const webhook: Webhook = {
    id,
    name: payload.name ?? `Webhook ${id}`,
    status: payload.status ?? "active",
    topic: payload.topic,
    delivery_url: payload.delivery_url,
    secret: payload.secret ?? `whsec_${Math.random().toString(36).slice(2)}`,
    date_created: now,
    date_modified: now,
  };
  db.webhooks.push(webhook);
  return { status: 201, body: webhook };
});
