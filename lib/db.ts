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

function emptyStore(): Store {
  return {
    products: [],
    variations: [],
    customers: [],
    orders: [],
    webhooks: [],
    webhookDeliveries: [],
    credentials: [],
    logs: [],
    nextId: {
      product: 1,
      variation: 1,
      customer: 1,
      order: 1,
      webhook: 1,
      delivery: 1,
    },
  };
}

// Survives Next.js dev hot-reload (module re-evaluation) by pinning to globalThis.
// This is an in-memory JSON store only — data resets whenever the server process restarts.
const globalForStore = globalThis as unknown as { __woobridgeStore?: Store };

export const db: Store = globalForStore.__woobridgeStore ?? emptyStore();
if (!globalForStore.__woobridgeStore) {
  globalForStore.__woobridgeStore = db;
}

export function nextId(kind: keyof Store["nextId"]): number {
  const id = db.nextId[kind];
  db.nextId[kind] = id + 1;
  return id;
}

export function resetStore() {
  const fresh = emptyStore();
  Object.assign(db, fresh);
}

export function pushLog(log: RequestLog) {
  db.logs.unshift(log);
  if (db.logs.length > 500) db.logs.length = 500;
}
