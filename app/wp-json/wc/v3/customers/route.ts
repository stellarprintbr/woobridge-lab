import { wooRoute } from "@/lib/route-handler";
import { db, nextId } from "@/lib/db";
import { paginate, sortItems, isoNow } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";
import type { Customer } from "@/lib/types";

export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  let items = db.customers;

  const email = p.get("email");
  if (email) items = items.filter((c) => c.email === email);

  const search = p.get("search");
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (c) => c.email.toLowerCase().includes(q) || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
    );
  }

  items = sortItems(items, p.get("orderby"), p.get("order"), {
    date: "date_created",
    id: "id",
  });

  const { slice, total, totalPages } = paginate(items, p);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);
  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req) => {
  const payload: Partial<Customer> = await req.json().catch(() => ({}));
  if (!payload.email) throw Errors.invalidParam({ email: "email is required" });

  const now = isoNow();
  const id = nextId("customer");
  const customer: Customer = {
    id,
    email: payload.email,
    first_name: payload.first_name ?? "",
    last_name: payload.last_name ?? "",
    username: payload.username ?? payload.email.split("@")[0],
    role: "customer",
    billing: payload.billing ?? ({} as Customer["billing"]),
    shipping: payload.shipping ?? ({} as Customer["shipping"]),
    date_created: now,
    date_modified: now,
  };
  db.customers.push(customer);
  dispatchEvent("customer.created", customer);
  return { status: 201, body: customer };
});
