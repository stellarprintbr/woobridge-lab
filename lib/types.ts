export type Permission = "read" | "write" | "read_write";

export interface Credential {
  id: string;
  key: string; // ck_...
  secret: string; // cs_..., plaintext — this is a test lab, keys are meant to be visible
  secretHash: string; // sha256 of secret, used to verify Basic Auth
  secretPreview: string; // last 4 chars, kept for compatibility
  permissions: Permission;
  description: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: "simple" | "variable" | "grouped" | "external";
  status: "draft" | "pending" | "private" | "publish";
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  weight: string;
  length: string;
  width: string;
  height: string;
  virtual: boolean;
  downloadable: boolean;
  permalink: string;
  categories: ProductCategory[];
  images: { id: number; src: string }[];
  date_created: string;
  date_modified: string;
}

export interface ProductVariation {
  id: number;
  product_id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  attributes: { name: string; option: string }[];
  image: { id: number; src: string } | null;
  weight: string;
  date_created: string;
  date_modified: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  billing: Address;
  shipping: Address;
  date_created: string;
  date_modified: string;
}

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  sku: string;
  price: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

export interface Order {
  id: number;
  number: string;
  status: OrderStatus;
  currency: string;
  currency_symbol: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  shipping_total: string;
  total: string;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_id: number;
  billing: Address;
  shipping: Address;
  customer_note: string;
  line_items: OrderLineItem[];
}

export type WebhookTopic =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "order.created"
  | "order.updated"
  | "order.deleted"
  | "customer.created"
  | "customer.updated"
  | "customer.deleted";

export interface Webhook {
  id: number;
  name: string;
  status: "active" | "paused" | "disabled";
  topic: WebhookTopic;
  delivery_url: string;
  secret: string;
  date_created: string;
  date_modified: string;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  topic: WebhookTopic;
  url: string;
  request_headers: Record<string, string>;
  request_body: string;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number;
  attempt: number;
  success: boolean;
  created_at: string;
}

export interface RequestLog {
  id: string;
  credential_id: string | null;
  consumer_key: string | null;
  method: string;
  path: string;
  query_params: Record<string, string>;
  headers: Record<string, string>;
  request_body: unknown;
  response_status: number;
  response_body: unknown;
  duration_ms: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
}
