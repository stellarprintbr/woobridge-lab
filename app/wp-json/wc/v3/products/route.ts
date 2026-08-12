import { wooRoute } from "@/lib/route-handler";
import { db, nextId } from "@/lib/db";
import { paginate, sortItems, isoNow, money } from "@/lib/format";
import { Errors } from "@/lib/errors";
import { dispatchEvent } from "@/lib/webhooks";
import type { Product } from "@/lib/types";

export const GET = wooRoute("read", async (_req, ctx) => {
  const p = ctx.url.searchParams;
  let items = db.products;

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
  let payload: Partial<Product>;
  try {
    payload = await req.json();
  } catch {
    throw Errors.invalidParam();
  }
  if (!payload.name) throw Errors.invalidParam({ name: "name is required" });

  const now = isoNow();
  const id = nextId("product");
  const regular = payload.regular_price ?? "0.00";
  const product: Product = {
    id,
    name: payload.name,
    slug: payload.slug ?? payload.name.toLowerCase().replace(/\s+/g, "-"),
    type: payload.type ?? "simple",
    status: payload.status ?? "publish",
    sku: payload.sku ?? `SKU-${id}`,
    price: payload.sale_price || regular,
    regular_price: money(parseFloat(String(regular)) || 0),
    sale_price: payload.sale_price ?? "",
    description: payload.description ?? "",
    short_description: payload.short_description ?? "",
    manage_stock: payload.manage_stock ?? false,
    stock_quantity: payload.stock_quantity ?? null,
    stock_status: payload.stock_status ?? "instock",
    weight: payload.weight ?? "",
    length: payload.length ?? "",
    width: payload.width ?? "",
    height: payload.height ?? "",
    virtual: payload.virtual ?? false,
    downloadable: payload.downloadable ?? false,
    permalink: `https://woobridge.lab/produto/${payload.slug ?? id}`,
    categories: payload.categories ?? [],
    images: payload.images ?? [],
    date_created: now,
    date_modified: now,
  };
  db.products.push(product);
  dispatchEvent("product.created", product);
  return { status: 201, body: product };
});
