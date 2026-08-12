import { wooRoute } from "@/lib/route-handler";
import { listOrders, listProducts, createOrder } from "@/lib/repo";
import { paginate, sortItems, money } from "@/lib/format";
import { dispatchEvent } from "@/lib/webhooks";
import type { OrderLineItem } from "@/lib/types";

export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  let items = await listOrders();

  const status = p.get("status");
  if (status) items = items.filter((o) => o.status === status);

  const customer = p.get("customer");
  if (customer) items = items.filter((o) => o.customer_id === Number(customer));

  const search = p.get("search");
  if (search) items = items.filter((o) => o.number.includes(search));

  const after = p.get("after");
  if (after) items = items.filter((o) => o.date_created >= after);

  const before = p.get("before");
  if (before) items = items.filter((o) => o.date_created <= before);

  items = sortItems(items, p.get("orderby"), p.get("order"), {
    date: "date_created",
    id: "id",
    modified: "date_modified",
  });

  const { slice, total, totalPages } = paginate(items, p);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);
  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req) => {
  const payload = await req.json().catch(() => ({}));
  const products = await listProducts();

  const lineItems: OrderLineItem[] = (payload.line_items ?? []).map((li: Partial<OrderLineItem>, idx: number) => {
    const product = products.find((p) => p.id === li.product_id);
    const qty = li.quantity ?? 1;
    const price = product ? parseFloat(product.price) : parseFloat(String(li.price ?? "0"));
    const total = price * qty;
    return {
      id: idx + 1,
      name: product?.name ?? li.name ?? "Item",
      product_id: li.product_id ?? 0,
      variation_id: li.variation_id ?? 0,
      quantity: qty,
      tax_class: li.tax_class ?? "",
      subtotal: money(total),
      subtotal_tax: "0.00",
      total: money(total),
      total_tax: "0.00",
      sku: product?.sku ?? li.sku ?? "",
      price: money(price),
    };
  });

  const itemsTotal = lineItems.reduce((sum, li) => sum + parseFloat(li.total), 0);
  const shippingTotal = parseFloat(payload.shipping_total ?? "0") || 0;
  const discountTotal = parseFloat(payload.discount_total ?? "0") || 0;

  const order = await createOrder({
    status: payload.status ?? "pending",
    currency: payload.currency ?? "BRL",
    discount_total: discountTotal,
    shipping_total: shippingTotal,
    total: itemsTotal + shippingTotal - discountTotal,
    payment_method: payload.payment_method ?? "",
    payment_method_title: payload.payment_method_title ?? "",
    transaction_id: payload.transaction_id ?? "",
    customer_id: payload.customer_id ?? 0,
    billing: payload.billing ?? {},
    shipping: payload.shipping ?? {},
    customer_note: payload.customer_note ?? "",
    line_items: lineItems,
  });
  dispatchEvent("order.created", order);
  return { status: 201, body: order };
});
