import { wooRoute } from "@/lib/route-handler";
import { getCustomer, updateCustomer } from "@/lib/repo";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const customer = await getCustomer(id);
  if (!customer) throw Errors.invalidId("customer");
  return { status: 200, body: customer };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const payload = await req.json().catch(() => ({}));
  const customer = await updateCustomer(id, payload);
  if (!customer) throw Errors.invalidId("customer");
  dispatchEvent("customer.updated", customer);
  return { status: 200, body: customer };
});
