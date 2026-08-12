import { wooRoute } from "@/lib/route-handler";
import { listProducts, createProduct } from "@/lib/repo";
import { paginate, sortItems } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";

export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  let items = await listProducts();

  const search = p.get("search");
  if (search) items = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const sku = p.get("sku");
  if (sku) items = items.filter((i) => i.sku === sku);

  const status = p.get("status");
  if (status) items = items.filter((i) => i.status === status);

  const type = p.get("type");
  if (type) items = items.filter((i) => i.type === type);

  const stockStatus = p.get("stock_status");
  if (stockStatus) items = items.filter((i) => i.stock_status === stockStatus);

  const category = p.get("category");
  if (category) items = items.filter((i) => i.categories.some((c) => String(c.id) === category));

  items = sortItems(items, p.get("orderby"), p.get("order"), {
    date: "date_created",
    id: "id",
    title: "name",
    modified: "date_modified",
  });

  const { slice, total, totalPages } = paginate(items, p);
  ctx.headers["X-WP-Total"] = String(total);
  ctx.headers["X-WP-TotalPages"] = String(totalPages);

  return { status: 200, body: slice };
});

export const POST = wooRoute("write", async (req) => {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    throw Errors.invalidParam();
  }
  if (!payload.name || typeof payload.name !== "string") throw Errors.invalidParam({ name: "name is required" });

  const product = await createProduct(payload as { name: string });
  dispatchEvent("product.created", product);
  return { status: 201, body: product };
});
