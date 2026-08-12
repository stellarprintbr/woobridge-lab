import { listProducts } from "@/lib/repo";
import { wooRoute } from "@/lib/route-handler";

export const GET = wooRoute("read", async () => {
  const products = await listProducts();
  return { status: 200, body: { count: products.length } };
});
