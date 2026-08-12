import { supabase } from "./supabase";
import { listProducts, createCustomer, createOrder, createWebhook } from "./repo";
import type { Order, OrderLineItem, Webhook } from "./types";

const FIRST_NAMES = ["João", "Maria", "Pedro", "Ana", "Lucas", "Juliana", "Carlos", "Fernanda", "Rafael", "Beatriz", "Gustavo", "Camila", "Bruno", "Larissa", "Thiago", "Patrícia", "Diego", "Amanda", "Felipe", "Letícia"];
const LAST_NAMES = ["Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Ferreira", "Rodrigues", "Almeida", "Gomes"];
const PAYMENT_METHODS = [
  { method: "pix", title: "PIX" },
  { method: "cc", title: "Cartão de Crédito" },
  { method: "bacs", title: "Boleto Bancário" },
];
const STATUSES: Order["status"][] = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded"];

function maskCpf(): string {
  const n = () => Math.floor(Math.random() * 900 + 100);
  return `${n()}.${n()}.${n()}-**`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Clears the demo/ephemeral data (customers, orders, webhooks + their history and the
// request log) but leaves products and credentials alone — those are real, persisted
// resources managed through the dashboard, not regenerated on every reset.
export async function resetStore() {
  const db = supabase();
  await db.from("webhook_deliveries").delete().not("id", "is", null);
  await db.from("request_logs").delete().not("id", "is", null);
  await db.from("orders").delete().not("id", "is", null);
  await db.from("webhooks").delete().not("id", "is", null);
  await db.from("customers").delete().not("id", "is", null);
}

export async function seedDemoStore() {
  await resetStore();

  const products = await listProducts();
  if (products.length === 0) {
    throw new Error("Nenhum produto encontrado — rode supabase/schema.sql (com a seção de seed) antes.");
  }

  const customers = [];
  for (let i = 0; i < 20; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const address = {
      first_name: first,
      last_name: last,
      address_1: `Rua ${pick(["das Flores", "Brasil", "São Paulo", "Minas", "Bahia"])}, ${Math.floor(Math.random() * 999)}`,
      city: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre"]),
      state: pick(["SP", "RJ", "MG", "PR", "RS"]),
      postcode: `${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 900 + 100)}`,
      country: "BR",
      phone: `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
    };
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com.br`;
    const customer = await createCustomer({
      email,
      first_name: first,
      last_name: last,
      username: `${first.toLowerCase()}${last.toLowerCase()}${i}`,
      billing: { ...address, email },
      shipping: { ...address, email },
    });
    customers.push(customer);
  }

  for (let i = 0; i < 30; i++) {
    const customer = pick(customers);
    const items: OrderLineItem[] = [];
    const itemCount = 1 + Math.floor(Math.random() * 3);
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const product = pick(products);
      const qty = 1 + Math.floor(Math.random() * 3);
      const price = parseFloat(product.price);
      const lineTotal = price * qty;
      total += lineTotal;
      items.push({
        id: j + 1,
        name: product.name,
        product_id: product.id,
        variation_id: 0,
        quantity: qty,
        tax_class: "",
        subtotal: lineTotal.toFixed(2),
        subtotal_tax: "0.00",
        total: lineTotal.toFixed(2),
        total_tax: "0.00",
        sku: product.sku,
        price: price.toFixed(2),
      });
    }
    const shipping = 15 + Math.random() * 20;
    const payment = pick(PAYMENT_METHODS);
    await createOrder({
      status: pick(STATUSES),
      currency: "BRL",
      discount_total: 0,
      shipping_total: shipping,
      total: total + shipping,
      payment_method: payment.method,
      payment_method_title: payment.title,
      transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`,
      customer_id: customer.id,
      billing: customer.billing,
      shipping: customer.shipping,
      line_items: items,
    });
  }

  const webhookUrls = [
    "https://webhook.site/demo-1",
    "https://webhook.site/demo-2",
    "https://webhook.site/demo-3",
  ];
  const topics: Webhook["topic"][] = [
    "order.created",
    "order.updated",
    "product.created",
    "product.updated",
    "customer.created",
  ];
  for (let i = 0; i < 5; i++) {
    await createWebhook({
      name: `Webhook Demo ${i + 1}`,
      status: "active",
      topic: topics[i],
      delivery_url: webhookUrls[i % webhookUrls.length],
    });
  }

  return {
    products: products.length,
    customers: customers.length,
    orders: 30,
    webhooks: 5,
  };
}

export function maskedCpfExample(): string {
  return maskCpf();
}
