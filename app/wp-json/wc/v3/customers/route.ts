import { wooRoute } from "@/lib/route-handler";
import { listCustomers, createCustomer } from "@/lib/repo";
import { paginate, sortItems } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  let items = await listCustomers();

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
  const payload = await req.json().catch(() => ({}));
  if (!payload.email) throw Errors.invalidParam({ email: "email is required" });

  const customer = await createCustomer(payload);
  dispatchEvent("customer.created", customer);
  return { status: 201, body: customer };
});
