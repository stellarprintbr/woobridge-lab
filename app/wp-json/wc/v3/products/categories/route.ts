import { wooRoute } from "@/lib/route-handler";
import { db } from "@/lib/db";

export const GET = wooRoute("read", async (_req, ctx) => {
  const set = new Map<number, { id: number; name: string; slug: string }>();
  for (const p of db.products) {
    for (const c of p.categories) set.set(c.id, c);
  }
  const items = Array.from(set.values());
  ctx.headers["X-WP-Total"] = String(items.length);
  ctx.headers["X-WP-TotalPages"] = "1";
  return { status: 200, body: items };
});
