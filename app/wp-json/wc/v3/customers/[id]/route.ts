import { wooRoute } from "@/lib/route-handler";
import { db } from "@/lib/db";
import { isoNow } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const id = Number(ctx.params.id);
  const customer = db.customers.find((c) => c.id === id);
  if (!customer) throw Errors.invalidId("customer");
  return { status: 200, body: customer };
});

export const PUT = wooRoute("write", async (req, ctx) => {
  const id = Number(ctx.params.id);
  const customer = db.customers.find((c) => c.id === id);
  if (!customer) throw Errors.invalidId("customer");

  const payload = await req.json().catch(() => ({}));
  Object.assign(customer, payload);
  customer.date_modified = isoNow();
  dispatchEvent("customer.updated", customer);
  return { status: 200, body: customer };
});
