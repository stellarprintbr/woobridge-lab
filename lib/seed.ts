import { db, nextId, resetStore } from "./db";
import { isoNow, money } from "./format";
import type { Customer, Order, OrderLineItem, Product, ProductVariation, Webhook } from "./types";

const PRODUCT_NAMES = ["Camiseta", "Calça", "Boné", "Moletom", "Tênis", "Jaqueta", "Bermuda", "Regata", "Meia", "Mochila"];
const COLORS = ["Preto", "Branco", "Azul", "Cinza"];
const SIZES = ["P", "M", "G", "GG"];
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function seedDemoStore() {
  resetStore();

  const categories = [
    { id: 1, name: "Camisetas", slug: "camisetas" },
    { id: 2, name: "Calçados", slug: "calcados" },
    { id: 3, name: "Acessórios", slug: "acessorios" },
    { id: 4, name: "Moletons", slug: "moletons" },
    { id: 5, name: "Calças", slug: "calcas" },
  ];

  const now = isoNow();

  for (let i = 0; i < 10; i++) {
    const name = `${pick(PRODUCT_NAMES)} ${pick(COLORS)}`;
    const regular = 59.9 + Math.random() * 200;
    const sale = Math.random() > 0.5 ? regular * 0.85 : regular;
    const id = nextId("product");
    const product: Product = {
      id,
      name: `${name} ${id}`,
      slug: `${slugify(name)}-${id}`,
      type: "simple",
      status: "publish",
      sku: `SKU-${1000 + id}`,
      price: money(sale),
      regular_price: money(regular),
      sale_price: sale !== regular ? money(sale) : "",
      description: `Produto ${name} de alta qualidade, ideal para o dia a dia.`,
      short_description: `${name} confortável e durável.`,
      manage_stock: true,
      stock_quantity: Math.floor(Math.random() * 100),
      stock_status: "instock",
      weight: "0.3",
      length: "30",
      width: "20",
      height: "5",
      virtual: false,
      downloadable: false,
      permalink: `https://woobridge.lab/produto/${slugify(name)}-${id}`,
      categories: [pick(categories)],
      images: [],
      date_created: now,
      date_modified: now,
    };
    db.products.push(product);
  }

  for (let i = 0; i < 5; i++) {
    const name = `${pick(PRODUCT_NAMES)} Variavel`;
    const regular = 89.9 + Math.random() * 150;
    const id = nextId("product");
    const product: Product = {
      id,
      name: `${name} ${id}`,
      slug: `${slugify(name)}-${id}`,
      type: "variable",
      status: "publish",
      sku: `SKU-VAR-${1000 + id}`,
      price: money(regular),
      regular_price: money(regular),
      sale_price: "",
      description: `${name} disponível em várias cores e tamanhos.`,
      short_description: `${name} com variações de cor e tamanho.`,
      manage_stock: false,
      stock_quantity: null,
      stock_status: "instock",
      weight: "0.4",
      length: "30",
      width: "20",
      height: "5",
      virtual: false,
      downloadable: false,
      permalink: `https://woobridge.lab/produto/${slugify(name)}-${id}`,
      categories: [pick(categories)],
      images: [],
      date_created: now,
      date_modified: now,
    };
    db.products.push(product);

    for (const color of COLORS.slice(0, 2)) {
      for (const size of SIZES.slice(0, 2)) {
        const vId = nextId("variation");
        const variation: ProductVariation = {
          id: vId,
          product_id: id,
          sku: `${product.sku}-${color.slice(0, 2).toUpperCase()}-${size}`,
          price: money(regular),
          regular_price: money(regular),
          sale_price: "",
          stock_quantity: Math.floor(Math.random() * 50),
          stock_status: "instock",
          attributes: [
            { name: "Cor", option: color },
            { name: "Tamanho", option: size },
          ],
          image: null,
          weight: "0.4",
          date_created: now,
          date_modified: now,
        };
        db.variations.push(variation);
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const id = nextId("customer");
    const address = {
      first_name: first,
      last_name: last,
      address_1: `Rua ${pick(["das Flores", "Brasil", "São Paulo", "Minas", "Bahia"])}, ${Math.floor(Math.random() * 999)}`,
      city: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre"]),
      state: pick(["SP", "RJ", "MG", "PR", "RS"]),
      postcode: `${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 900 + 100)}`,
      country: "BR",
      email: `${first.toLowerCase()}.${last.toLowerCase()}${id}@example.com.br`,
      phone: `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
    };
    const customer: Customer = {
      id,
      email: address.email!,
      first_name: first,
      last_name: last,
      username: `${first.toLowerCase()}${last.toLowerCase()}${id}`,
      role: "customer",
      billing: { ...address },
      shipping: { ...address },
      date_created: now,
      date_modified: now,
    };
    db.customers.push(customer);
  }

  for (let i = 0; i < 30; i++) {
    const customer = pick(db.customers);
    const items: OrderLineItem[] = [];
    const itemCount = 1 + Math.floor(Math.random() * 3);
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const product = pick(db.products);
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
        subtotal: money(lineTotal),
        subtotal_tax: "0.00",
        total: money(lineTotal),
        total_tax: "0.00",
        sku: product.sku,
        price: money(price),
      });
    }
    const shipping = 15 + Math.random() * 20;
    const payment = pick(PAYMENT_METHODS);
    const id = nextId("order");
    const order: Order = {
      id,
      number: String(1000 + id),
      status: pick(STATUSES),
      currency: "BRL",
      currency_symbol: "R$",
      date_created: now,
      date_modified: now,
      discount_total: "0.00",
      shipping_total: money(shipping),
      total: money(total + shipping),
      payment_method: payment.method,
      payment_method_title: payment.title,
      transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`,
      customer_id: customer.id,
      billing: { ...customer.billing },
      shipping: { ...customer.shipping },
      customer_note: "",
      line_items: items,
    };
    db.orders.push(order);
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
    const id = nextId("webhook");
    const webhook: Webhook = {
      id,
      name: `Webhook Demo ${i + 1}`,
      status: "active",
      topic: topics[i],
      delivery_url: webhookUrls[i % webhookUrls.length],
      secret: `whsec_${Math.random().toString(36).slice(2)}`,
      date_created: now,
      date_modified: now,
    };
    db.webhooks.push(webhook);
  }

  return {
    products: db.products.length,
    variations: db.variations.length,
    customers: db.customers.length,
    orders: db.orders.length,
    webhooks: db.webhooks.length,
  };
}

export function maskedCpfExample(): string {
  return maskCpf();
}
