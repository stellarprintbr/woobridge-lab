import { listCustomers } from "@/lib/repo";
import { wooRoute } from "@/lib/route-handler";

export const GET = wooRoute("read", async () => {
  const customers = await listCustomers();
  return { status: 200, body: { count: customers.length } };
});
