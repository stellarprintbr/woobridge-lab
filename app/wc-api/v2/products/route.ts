import { listProducts } from "@/lib/repo";
import { wooRoute } from "@/lib/route-handler";

// Legacy WooCommerce REST API (pre wp-json, removed in WooCommerce 3.0). Some older
// ERPs still call this path — it uses filter[limit]/filter[offset] pagination and
// wraps the list in a { products: [...] } envelope, unlike the flat array on wc/v3.
export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  const limit = Number(p.get("filter[limit]") ?? p.get("limit") ?? 10);
  const offset = Number(p.get("filter[offset]") ?? p.get("offset") ?? 0);

  const products = await listProducts();
  const slice = products.slice(offset, offset + limit);
  return { status: 200, body: { products: slice } };
});
