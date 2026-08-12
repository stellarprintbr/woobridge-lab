import { sha256 } from "./crypto";
import type { Credential, Permission, Product, ProductVariation } from "./types";

// Fixed baseline data for the test lab: product catalog and access keys never change
// between deploys/restarts. This makes the lab usable immediately after a cold start
// (serverless invocations don't share memory), without depending on a seed step.
const FIXED_DATE = "2026-01-01T00:00:00.000Z";

interface FixedCredentialSeed {
  id: string;
  key: string;
  secret: string;
  permissions: Permission;
  description: string;
}

export const FIXED_CREDENTIAL_SEEDS: FixedCredentialSeed[] = [
  {
    id: "fixed-cred-1",
    key: "ck_woobridge_lab_a1b2c3d4e5f60708",
    secret: "cs_woobridge_lab_9f8e7d6c5b4a3210",
    permissions: "read_write",
    description: "Acesso Principal (leitura e escrita)",
  },
  {
    id: "fixed-cred-2",
    key: "ck_woobridge_lab_11aa22bb33cc44dd",
    secret: "cs_woobridge_lab_dd44cc33bb22aa11",
    permissions: "read",
    description: "Acesso Somente Leitura",
  },
  {
    id: "fixed-cred-3",
    key: "ck_woobridge_lab_55ee66ff77001188",
    secret: "cs_woobridge_lab_88110077ff66ee55",
    permissions: "write",
    description: "Acesso Somente Escrita",
  },
  {
    id: "fixed-cred-4",
    key: "ck_woobridge_lab_99aa88bb77cc66dd",
    secret: "cs_woobridge_lab_dd66cc77bb88aa99",
    permissions: "read_write",
    description: "Acesso ERP / Integração",
  },
  {
    id: "fixed-cred-5",
    key: "ck_woobridge_lab_2299441166887733",
    secret: "cs_woobridge_lab_3377886611442299",
    permissions: "read_write",
    description: "Acesso Testes Automatizados",
  },
];

export function buildFixedCredentials(): Credential[] {
  return FIXED_CREDENTIAL_SEEDS.map((c) => ({
    id: c.id,
    key: c.key,
    secretHash: sha256(c.secret),
    secretPreview: c.secret.slice(-4),
    secret: c.secret,
    fixed: true,
    permissions: c.permissions,
    description: c.description,
    created_at: FIXED_DATE,
    last_used_at: null,
    revoked_at: null,
  }));
}

const CATEGORIES = [
  { id: 1, name: "Camisetas", slug: "camisetas" },
  { id: 2, name: "Calçados", slug: "calcados" },
  { id: 3, name: "Acessórios", slug: "acessorios" },
  { id: 4, name: "Moletons", slug: "moletons" },
  { id: 5, name: "Calças", slug: "calcas" },
];

function simpleProduct(
  id: number,
  name: string,
  sku: string,
  regular: number,
  sale: number | null,
  stock: number,
  category: (typeof CATEGORIES)[number]
): Product {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    id,
    name,
    slug: `${slug}-${id}`,
    type: "simple",
    status: "publish",
    sku,
    price: (sale ?? regular).toFixed(2),
    regular_price: regular.toFixed(2),
    sale_price: sale ? sale.toFixed(2) : "",
    description: `${name} de alta qualidade, ideal para o dia a dia.`,
    short_description: `${name} confortável e durável.`,
    manage_stock: true,
    stock_quantity: stock,
    stock_status: stock > 0 ? "instock" : "outofstock",
    weight: "0.3",
    length: "30",
    width: "20",
    height: "5",
    virtual: false,
    downloadable: false,
    permalink: `https://woobridge.lab/produto/${slug}-${id}`,
    categories: [category],
    images: [],
    date_created: FIXED_DATE,
    date_modified: FIXED_DATE,
  };
}

export function buildFixedCatalog(): { products: Product[]; variations: ProductVariation[] } {
  const products: Product[] = [
    simpleProduct(101, "Camiseta Preta Básica", "SKU-CAM-101", 59.9, 49.9, 120, CATEGORIES[0]),
    simpleProduct(102, "Camiseta Branca Estampada", "SKU-CAM-102", 69.9, null, 80, CATEGORIES[0]),
    simpleProduct(103, "Tênis Runner Cinza", "SKU-TEN-103", 249.9, 199.9, 40, CATEGORIES[1]),
    simpleProduct(104, "Tênis Casual Branco", "SKU-TEN-104", 219.9, null, 55, CATEGORIES[1]),
    simpleProduct(105, "Boné Aba Reta Preto", "SKU-BON-105", 79.9, null, 100, CATEGORIES[2]),
    simpleProduct(106, "Mochila Executiva Cinza", "SKU-MOC-106", 189.9, 159.9, 30, CATEGORIES[2]),
    simpleProduct(107, "Moletom Canguru Azul", "SKU-MOL-107", 159.9, null, 60, CATEGORIES[3]),
    simpleProduct(108, "Calça Jogger Preta", "SKU-CAL-108", 139.9, 119.9, 70, CATEGORIES[4]),
  ];

  const variableSpecs = [
    { id: 201, name: "Camiseta Polo Variável", sku: "SKU-VAR-201", price: 99.9, category: CATEGORIES[0] },
    { id: 202, name: "Moletom com Capuz Variável", sku: "SKU-VAR-202", price: 179.9, category: CATEGORIES[3] },
    { id: 203, name: "Calça Jeans Variável", sku: "SKU-VAR-203", price: 149.9, category: CATEGORIES[4] },
  ];
  const colors = ["Preto", "Branco", "Azul", "Cinza"];
  const sizes = ["P", "M", "G", "GG"];

  const variations: ProductVariation[] = [];
  let variationId = 301;
  for (const spec of variableSpecs) {
    const slug = spec.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    products.push({
      id: spec.id,
      name: spec.name,
      slug: `${slug}-${spec.id}`,
      type: "variable",
      status: "publish",
      sku: spec.sku,
      price: spec.price.toFixed(2),
      regular_price: spec.price.toFixed(2),
      sale_price: "",
      description: `${spec.name} disponível em várias cores e tamanhos.`,
      short_description: `${spec.name} com variações de cor e tamanho.`,
      manage_stock: false,
      stock_quantity: null,
      stock_status: "instock",
      weight: "0.4",
      length: "30",
      width: "20",
      height: "5",
      virtual: false,
      downloadable: false,
      permalink: `https://woobridge.lab/produto/${slug}-${spec.id}`,
      categories: [spec.category],
      images: [],
      date_created: FIXED_DATE,
      date_modified: FIXED_DATE,
    });

    for (const color of colors.slice(0, 2)) {
      for (const size of sizes.slice(0, 2)) {
        variations.push({
          id: variationId++,
          product_id: spec.id,
          sku: `${spec.sku}-${color.slice(0, 2).toUpperCase()}-${size}`,
          price: spec.price.toFixed(2),
          regular_price: spec.price.toFixed(2),
          sale_price: "",
          stock_quantity: 25,
          stock_status: "instock",
          attributes: [
            { name: "Cor", option: color },
            { name: "Tamanho", option: size },
          ],
          image: null,
          weight: "0.4",
          date_created: FIXED_DATE,
          date_modified: FIXED_DATE,
        });
      }
    }
  }

  return { products, variations };
}

export const FIXED_PRODUCT_NEXT_ID = 1000; // dynamically created products start above the fixed catalog
export const FIXED_VARIATION_NEXT_ID = 1000;
