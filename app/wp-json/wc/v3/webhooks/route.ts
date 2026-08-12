import { wooRoute } from "@/lib/route-handler";
import { listWebhooks, createWebhook } from "@/lib/repo";
import { paginate } from "@/lib/format";
import { Errors } from "@/lib/errors";

export const GET = wooRoute("read", async (_req, ctx) => {
  const items = await listWebhooks();
  const { slice, total, totalPages } = paginate(items, ctx.url.searchParams);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);
  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req) => {
  const payload = await req.json().catch(() => ({}));
  if (!payload.topic || !payload.delivery_url) {
    throw Errors.invalidParam({ topic: "topic and delivery_url are required" });
  }
  const webhook = await createWebhook(payload);
  return { status: 201, body: webhook };
});
