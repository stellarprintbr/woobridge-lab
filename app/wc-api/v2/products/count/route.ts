import { db } from "@/lib/db";
import { wooRoute } from "@/lib/route-handler";

export const GET = wooRoute("read", async () => {
  return { status: 200, body: { count: db.products.length } };
});
