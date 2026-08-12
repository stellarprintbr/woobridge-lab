import { db } from "@/lib/db";
import { wooRoute } from "@/lib/route-handler";

// Legacy WooCommerce REST API (pre wp-json, removed in WooCommerce 3.0) — some older
// ERPs still call this path instead of /wp-json/wc/v3/. Shimmed here purely for
// compatibility testing against that class of integration.
export const GET = wooRoute("read", async () => {
  return { status: 200, body: { count: db.orders.length } };
});
