import type {
  Credential,
  Customer,
  Order,
  Product,
  ProductVariation,
  RequestLog,
  Webhook,
  WebhookDelivery,
} from "./types";
import { buildFixedCatalog, buildFixedCredentials, FIXED_PRODUCT_NEXT_ID, FIXED_VARIATION_NEXT_ID } from "./fixtures";

interface Store {
  products: Product[];
  variations: ProductVariation[];
  customers: Customer[];
  orders: Order[];
  webhooks: Webhook[];
  webhookDeliveries: WebhookDelivery[];
  credentials: Credential[];
  logs: RequestLog[];
  nextId: Record<string, number>;
}

// The product catalog and the 5 access keys are fixed/hardcoded on purpose: this is a
// test lab, so every cold start (each serverless invocation may be a fresh process, with
// no shared memory) must expose the exact same catalog and the exact same, never-masked
// connection credentials — not a randomly regenerated one.
function baselineStore(): Store {
  const { products, variations } = buildFixedCatalog();
  return {
    products,
    variations,
    customers: [],
    orders: [],
    webhooks: [],
    webhookDeliveries: [],
    credentials: buildFixedCredentials(),
    logs: [],
    nextId: {
      product: FIXED_PRODUCT_NEXT_ID,
      variation: FIXED_VARIATION_NEXT_ID,
      customer: 1,
      order: 1,
      webhook: 1,
      delivery: 1,
    },
  };
}

// Survives Next.js dev hot-reload (module re-evaluation) by pinning to globalThis.
// This is an in-memory store only — data other than the fixed catalog/credentials
// resets whenever the server process restarts.
const globalForStore = globalThis as unknown as { __woobridgeStore?: Store };

export const db: Store = globalForStore.__woobridgeStore ?? baselineStore();
if (!globalForStore.__woobridgeStore) {
  globalForStore.__woobridgeStore = db;
}

export function nextId(kind: keyof Store["nextId"]): number {
  const id = db.nextId[kind];
  db.nextId[kind] = id + 1;
  return id;
}

export function resetStore() {
  const fresh = baselineStore();
  Object.assign(db, fresh);
}

export function pushLog(log: RequestLog) {
  db.logs.unshift(log);
  if (db.logs.length > 500) db.logs.length = 500;
}
