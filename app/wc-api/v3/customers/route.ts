import { listCustomers } from "@/lib/repo";
import { wooRoute } from "@/lib/route-handler";

export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  const limit = Number(p.get("filter[limit]") ?? p.get("limit") ?? 10);
  const offset = Number(p.get("filter[offset]") ?? p.get("offset") ?? 0);

  const customers = await listCustomers();
  const slice = customers.slice(offset, offset + limit);
  return { status: 200, body: { customers: slice } };
});
