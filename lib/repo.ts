import { supabase } from "./supabase";
import type {
  Credential,
  Customer,
  Order,
  OrderLineItem,
  Permission,
  Product,
  ProductCategory,
  ProductVariation,
  RequestLog,
  Webhook,
  WebhookDelivery,
  WebhookTopic,
} from "./types";

function num(v: number | string | null | undefined): string {
  return v === null || v === undefined ? "" : Number(v).toFixed(2);
}

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Supabase error (${what}): ${res.error.message}`);
  return res.data as T;
}

// ── products ────────────────────────────────────────────────────────────
interface ProductRow {
  id: number;
  name: string;
  slug: string;
  type: Product["type"];
  status: Product["status"];
  sku: string | null;
  price: number;
  regular_price: number;
  sale_price: number | null;
  description: string;
  short_description: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: Product["stock_status"];
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  virtual: boolean;
  downloadable: boolean;
  permalink: string | null;
  categories: ProductCategory[];
  images: Product["images"];
  date_created: string;
  date_modified: string;
}

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    status: r.status,
    sku: r.sku ?? "",
    price: num(r.price),
    regular_price: num(r.regular_price),
    sale_price: r.sale_price === null ? "" : num(r.sale_price),
    description: r.description,
    short_description: r.short_description,
    manage_stock: r.manage_stock,
    stock_quantity: r.stock_quantity,
    stock_status: r.stock_status,
    weight: r.weight ?? "",
    length: r.length ?? "",
    width: r.width ?? "",
    height: r.height ?? "",
    virtual: r.virtual,
    downloadable: r.downloadable,
    permalink: r.permalink ?? "",
    categories: r.categories ?? [],
    images: r.images ?? [],
    date_created: r.date_created,
    date_modified: r.date_modified,
  };
}

export async function listProducts(): Promise<Product[]> {
  const res = await supabase().from("products").select("*").order("id", { ascending: true });
  return check(res, "listProducts").map(mapProduct);
}

export async function getProduct(id: number): Promise<Product | null> {
  const res = await supabase().from("products").select("*").eq("id", id).maybeSingle();
  const row = check(res, "getProduct");
  return row ? mapProduct(row) : null;
}

export interface ProductInput {
  name: string;
  slug?: string;
  type?: Product["type"];
  status?: Product["status"];
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: Product["stock_status"];
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  virtual?: boolean;
  downloadable?: boolean;
  permalink?: string;
  categories?: ProductCategory[];
  images?: Product["images"];
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const regular = parseFloat(input.regular_price ?? "0") || 0;
  const sale = input.sale_price ? parseFloat(input.sale_price) || 0 : null;
  const row = {
    name: input.name,
    slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
    type: input.type ?? "simple",
    status: input.status ?? "publish",
    sku: input.sku ?? null,
    price: sale ?? regular,
    regular_price: regular,
    sale_price: sale,
    description: input.description ?? "",
    short_description: input.short_description ?? "",
    manage_stock: input.manage_stock ?? true,
    stock_quantity: input.stock_quantity ?? null,
    stock_status: input.stock_status ?? "instock",
    weight: input.weight ?? "",
    length: input.length ?? "",
    width: input.width ?? "",
    height: input.height ?? "",
    virtual: input.virtual ?? false,
    downloadable: input.downloadable ?? false,
    categories: input.categories ?? [],
    images: input.images ?? [{ id: 0, src: "https://placehold.co/600x400/EEE/31343C" }],
  };
  const res = await supabase().from("products").insert(row).select("*").single();
  const created = check(res, "createProduct");
  if (input.permalink === undefined) {
    const withPermalink = await supabase()
      .from("products")
      .update({ permalink: `https://woobridge.lab/produto/${created.slug}-${created.id}` })
      .eq("id", created.id)
      .select("*")
      .single();
    return mapProduct(check(withPermalink, "createProduct:permalink"));
  }
  return mapProduct(created);
}

export async function updateProduct(id: number, patch: Record<string, unknown>): Promise<Product | null> {
  const row: Record<string, unknown> = { ...patch };
  if (patch.regular_price !== undefined) row.regular_price = parseFloat(String(patch.regular_price)) || 0;
  if (patch.sale_price !== undefined) row.sale_price = patch.sale_price ? parseFloat(String(patch.sale_price)) || 0 : null;
  if (patch.regular_price !== undefined || patch.sale_price !== undefined) {
    const current = await getProduct(id);
    if (!current) return null;
    const regular = row.regular_price !== undefined ? (row.regular_price as number) : parseFloat(current.regular_price);
    const sale = row.sale_price !== undefined ? (row.sale_price as number | null) : (current.sale_price ? parseFloat(current.sale_price) : null);
    row.price = sale ?? regular;
  }
  delete row.id;
  delete row.date_created;
  delete row.date_modified;
  const res = await supabase().from("products").update(row).eq("id", id).select("*").maybeSingle();
  const updated = check(res, "updateProduct");
  return updated ? mapProduct(updated) : null;
}

export async function deleteProduct(id: number): Promise<Product | null> {
  const res = await supabase().from("products").delete().eq("id", id).select("*").maybeSingle();
  const removed = check(res, "deleteProduct");
  return removed ? mapProduct(removed) : null;
}

// ── product variations ─────────────────────────────────────────────────
interface VariationRow {
  id: number;
  product_id: number;
  sku: string | null;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number | null;
  stock_status: ProductVariation["stock_status"];
  attributes: ProductVariation["attributes"];
  image: ProductVariation["image"];
  weight: string | null;
  date_created: string;
  date_modified: string;
}

function mapVariation(r: VariationRow): ProductVariation {
  return {
    id: r.id,
    product_id: r.product_id,
    sku: r.sku ?? "",
    price: num(r.price),
    regular_price: num(r.regular_price),
    sale_price: r.sale_price === null ? "" : num(r.sale_price),
    stock_quantity: r.stock_quantity,
    stock_status: r.stock_status,
    attributes: r.attributes ?? [],
    image: r.image ?? null,
    weight: r.weight ?? "",
    date_created: r.date_created,
    date_modified: r.date_modified,
  };
}

export async function listVariations(productId: number): Promise<ProductVariation[]> {
  const res = await supabase().from("product_variations").select("*").eq("product_id", productId).order("id");
  return check(res, "listVariations").map(mapVariation);
}

export async function getVariation(productId: number, id: number): Promise<ProductVariation | null> {
  const res = await supabase()
    .from("product_variations")
    .select("*")
    .eq("id", id)
    .eq("product_id", productId)
    .maybeSingle();
  const row = check(res, "getVariation");
  return row ? mapVariation(row) : null;
}

export async function createVariation(
  productId: number,
  input: Partial<ProductVariation>
): Promise<ProductVariation> {
  const regular = parseFloat(String(input.regular_price ?? "0")) || 0;
  const sale = input.sale_price ? parseFloat(String(input.sale_price)) || 0 : null;
  const row = {
    product_id: productId,
    sku: input.sku ?? null,
    price: sale ?? regular,
    regular_price: regular,
    sale_price: sale,
    stock_quantity: input.stock_quantity ?? null,
    stock_status: input.stock_status ?? "instock",
    attributes: input.attributes ?? [],
    image: input.image ?? null,
    weight: input.weight ?? "",
  };
  const res = await supabase().from("product_variations").insert(row).select("*").single();
  return mapVariation(check(res, "createVariation"));
}

export async function updateVariation(
  productId: number,
  id: number,
  patch: Record<string, unknown>
): Promise<ProductVariation | null> {
  const row: Record<string, unknown> = { ...patch };
  if (patch.regular_price !== undefined) row.regular_price = parseFloat(String(patch.regular_price)) || 0;
  if (patch.sale_price !== undefined) row.sale_price = patch.sale_price ? parseFloat(String(patch.sale_price)) || 0 : null;
  delete row.id;
  delete row.product_id;
  delete row.date_created;
  delete row.date_modified;
  const res = await supabase()
    .from("product_variations")
    .update(row)
    .eq("id", id)
    .eq("product_id", productId)
    .select("*")
    .maybeSingle();
  const updated = check(res, "updateVariation");
  return updated ? mapVariation(updated) : null;
}

// ── customers ───────────────────────────────────────────────────────────
export async function listCustomers(): Promise<Customer[]> {
  const res = await supabase().from("customers").select("*").order("id");
  return check(res, "listCustomers") as Customer[];
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const res = await supabase().from("customers").select("*").eq("id", id).maybeSingle();
  return check(res, "getCustomer") as Customer | null;
}

export async function createCustomer(input: Partial<Customer> & { email: string }): Promise<Customer> {
  const row = {
    email: input.email,
    first_name: input.first_name ?? "",
    last_name: input.last_name ?? "",
    username: input.username ?? input.email.split("@")[0],
    role: "customer",
    billing: input.billing ?? {},
    shipping: input.shipping ?? {},
  };
  const res = await supabase().from("customers").insert(row).select("*").single();
  return check(res, "createCustomer") as Customer;
}

export async function updateCustomer(id: number, patch: Record<string, unknown>): Promise<Customer | null> {
  const row = { ...patch };
  delete row.id;
  delete row.date_created;
  delete row.date_modified;
  const res = await supabase().from("customers").update(row).eq("id", id).select("*").maybeSingle();
  return check(res, "updateCustomer") as Customer | null;
}

// ── orders ──────────────────────────────────────────────────────────────
interface OrderRow {
  id: number;
  number: string;
  status: Order["status"];
  currency: string;
  currency_symbol: string;
  date_created: string;
  date_modified: string;
  discount_total: number;
  shipping_total: number;
  total: number;
  payment_method: string | null;
  payment_method_title: string | null;
  transaction_id: string | null;
  customer_id: number | null;
  billing: Order["billing"];
  shipping: Order["shipping"];
  customer_note: string | null;
  line_items: OrderLineItem[];
}

function mapOrder(r: OrderRow): Order {
  return {
    id: r.id,
    number: r.number,
    status: r.status,
    currency: r.currency,
    currency_symbol: r.currency_symbol,
    date_created: r.date_created,
    date_modified: r.date_modified,
    discount_total: num(r.discount_total),
    shipping_total: num(r.shipping_total),
    total: num(r.total),
    payment_method: r.payment_method ?? "",
    payment_method_title: r.payment_method_title ?? "",
    transaction_id: r.transaction_id ?? "",
    customer_id: r.customer_id ?? 0,
    billing: r.billing ?? {},
    shipping: r.shipping ?? {},
    customer_note: r.customer_note ?? "",
    line_items: r.line_items ?? [],
  };
}

export async function listOrders(): Promise<Order[]> {
  const res = await supabase().from("orders").select("*").order("id");
  return check(res, "listOrders").map(mapOrder);
}

export async function getOrder(id: number): Promise<Order | null> {
  const res = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  const row = check(res, "getOrder");
  return row ? mapOrder(row) : null;
}

export interface OrderInput {
  status?: Order["status"];
  currency?: string;
  discount_total?: number;
  shipping_total?: number;
  total?: number;
  payment_method?: string;
  payment_method_title?: string;
  transaction_id?: string;
  customer_id?: number;
  billing?: Order["billing"];
  shipping?: Order["shipping"];
  customer_note?: string;
  line_items: OrderLineItem[];
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const row = {
    status: input.status ?? "pending",
    currency: input.currency ?? "BRL",
    currency_symbol: "R$",
    discount_total: input.discount_total ?? 0,
    shipping_total: input.shipping_total ?? 0,
    total: input.total ?? 0,
    payment_method: input.payment_method ?? "",
    payment_method_title: input.payment_method_title ?? "",
    transaction_id: input.transaction_id ?? "",
    customer_id: input.customer_id || null,
    billing: input.billing ?? {},
    shipping: input.shipping ?? {},
    customer_note: input.customer_note ?? "",
    line_items: input.line_items,
  };
  const res = await supabase().from("orders").insert(row).select("*").single();
  const created = check(res, "createOrder");
  const withNumber = await supabase()
    .from("orders")
    .update({ number: String(1000 + created.id) })
    .eq("id", created.id)
    .select("*")
    .single();
  return mapOrder(check(withNumber, "createOrder:number"));
}

export async function updateOrder(id: number, patch: Record<string, unknown>): Promise<Order | null> {
  const row = { ...patch };
  delete row.id;
  delete row.date_created;
  delete row.date_modified;
  const res = await supabase().from("orders").update(row).eq("id", id).select("*").maybeSingle();
  const updated = check(res, "updateOrder");
  return updated ? mapOrder(updated) : null;
}

export async function deleteOrder(id: number): Promise<Order | null> {
  const res = await supabase().from("orders").delete().eq("id", id).select("*").maybeSingle();
  const removed = check(res, "deleteOrder");
  return removed ? mapOrder(removed) : null;
}

// ── webhooks ────────────────────────────────────────────────────────────
export async function listWebhooks(): Promise<Webhook[]> {
  const res = await supabase().from("webhooks").select("*").order("id");
  return check(res, "listWebhooks") as Webhook[];
}

export async function listActiveWebhooksForTopic(topic: WebhookTopic): Promise<Webhook[]> {
  const res = await supabase().from("webhooks").select("*").eq("topic", topic).eq("status", "active");
  return check(res, "listActiveWebhooksForTopic") as Webhook[];
}

export async function getWebhook(id: number): Promise<Webhook | null> {
  const res = await supabase().from("webhooks").select("*").eq("id", id).maybeSingle();
  return check(res, "getWebhook") as Webhook | null;
}

export async function createWebhook(input: Partial<Webhook>): Promise<Webhook> {
  const row = {
    name: input.name ?? "",
    status: input.status ?? "active",
    topic: input.topic,
    delivery_url: input.delivery_url,
    secret: input.secret ?? `whsec_${Math.random().toString(36).slice(2)}`,
  };
  const res = await supabase().from("webhooks").insert(row).select("*").single();
  const created = check(res, "createWebhook") as Webhook;
  if (!input.name) {
    const named = await supabase()
      .from("webhooks")
      .update({ name: `Webhook ${created.id}` })
      .eq("id", created.id)
      .select("*")
      .single();
    return check(named, "createWebhook:name") as Webhook;
  }
  return created;
}

export async function updateWebhook(id: number, patch: Record<string, unknown>): Promise<Webhook | null> {
  const row = { ...patch };
  delete row.id;
  delete row.date_created;
  delete row.date_modified;
  const res = await supabase().from("webhooks").update(row).eq("id", id).select("*").maybeSingle();
  return check(res, "updateWebhook") as Webhook | null;
}

export async function deleteWebhook(id: number): Promise<Webhook | null> {
  const res = await supabase().from("webhooks").delete().eq("id", id).select("*").maybeSingle();
  return check(res, "deleteWebhook") as Webhook | null;
}

// ── webhook deliveries ─────────────────────────────────────────────────
export async function listWebhookDeliveries(webhookId?: number): Promise<WebhookDelivery[]> {
  let query = supabase().from("webhook_deliveries").select("*").order("created_at", { ascending: false });
  if (webhookId !== undefined) query = query.eq("webhook_id", webhookId);
  const res = await query;
  return check(res, "listWebhookDeliveries") as WebhookDelivery[];
}

export async function insertWebhookDelivery(delivery: Omit<WebhookDelivery, "id">): Promise<void> {
  const res = await supabase().from("webhook_deliveries").insert(delivery);
  check(res, "insertWebhookDelivery");
  // Keep only the newest 300 deliveries.
  const { data: stale } = await supabase()
    .from("webhook_deliveries")
    .select("id")
    .order("created_at", { ascending: false })
    .range(300, 10_300);
  if (stale && stale.length) {
    await supabase().from("webhook_deliveries").delete().in("id", stale.map((r: { id: number }) => r.id));
  }
}

// ── credentials ─────────────────────────────────────────────────────────
interface CredentialRow {
  id: string;
  key: string;
  secret: string;
  secret_hash: string;
  secret_preview: string;
  permissions: Permission;
  description: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

function mapCredential(r: CredentialRow): Credential {
  return {
    id: r.id,
    key: r.key,
    secret: r.secret,
    secretHash: r.secret_hash,
    secretPreview: r.secret_preview,
    permissions: r.permissions,
    description: r.description,
    created_at: r.created_at,
    last_used_at: r.last_used_at,
    revoked_at: r.revoked_at,
  };
}

export async function listCredentials(): Promise<Credential[]> {
  const res = await supabase().from("credentials").select("*").order("created_at", { ascending: false });
  return check(res, "listCredentials").map(mapCredential);
}

export async function getCredentialByKey(key: string): Promise<Credential | null> {
  const res = await supabase().from("credentials").select("*").eq("key", key).maybeSingle();
  const row = check(res, "getCredentialByKey");
  return row ? mapCredential(row) : null;
}

export async function createCredential(input: {
  key: string;
  secret: string;
  secretHash: string;
  secretPreview: string;
  permissions: Permission;
  description: string;
}): Promise<Credential> {
  const res = await supabase()
    .from("credentials")
    .insert({
      key: input.key,
      secret: input.secret,
      secret_hash: input.secretHash,
      secret_preview: input.secretPreview,
      permissions: input.permissions,
      description: input.description,
    })
    .select("*")
    .single();
  return mapCredential(check(res, "createCredential"));
}

export async function touchCredential(id: string, lastUsedAt: string): Promise<void> {
  const res = await supabase().from("credentials").update({ last_used_at: lastUsedAt }).eq("id", id);
  check(res, "touchCredential");
}

export async function revokeCredential(id: string, revokedAt: string): Promise<Credential | null> {
  const res = await supabase().from("credentials").update({ revoked_at: revokedAt }).eq("id", id).select("*").maybeSingle();
  const row = check(res, "revokeCredential");
  return row ? mapCredential(row) : null;
}

// ── request logs ────────────────────────────────────────────────────────
export async function listRequestLogs(): Promise<RequestLog[]> {
  const res = await supabase().from("request_logs").select("*").order("created_at", { ascending: false }).limit(500);
  return check(res, "listRequestLogs") as RequestLog[];
}

export async function insertRequestLog(log: Omit<RequestLog, "id">): Promise<void> {
  const res = await supabase().from("request_logs").insert(log);
  check(res, "insertRequestLog");
  const { data: stale } = await supabase()
    .from("request_logs")
    .select("id")
    .order("created_at", { ascending: false })
    .range(500, 10_500);
  if (stale && stale.length) {
    await supabase().from("request_logs").delete().in("id", stale.map((r: { id: string }) => r.id));
  }
}
