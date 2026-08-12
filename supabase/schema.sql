-- WooBridge Lab — Supabase schema
-- Run this once against a fresh Supabase project (SQL Editor or `supabase db push`).
-- All application access goes through Next.js API routes using the service_role key,
-- which bypasses RLS — the policies below only guard against direct anon/public access
-- from the browser or the Supabase auto-generated REST/PostgREST API.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- credentials — Consumer Key / Consumer Secret pairs used to authenticate
-- requests against /wp-json/wc/v3/*, WooCommerce-style.
--
-- `secret` stores the plaintext alongside `secret_hash`: this is a test lab
-- for compatibility testing, not a production credential store — keys are
-- meant to be visible in the dashboard and in the docs/playground examples,
-- never masked after creation.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                 -- ck_...
  secret text not null,                     -- cs_..., plaintext, shown in the dashboard
  secret_hash text not null,                -- sha256(secret), used to verify Basic Auth
  secret_preview text not null,             -- last 4 chars, kept for compatibility
  permissions text not null default 'read_write'
    check (permissions in ('read', 'write', 'read_write')),
  description text not null default '',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists idx_credentials_key on credentials (key);

-- ─────────────────────────────────────────────────────────────────────────
-- products — categories kept as embedded jsonb (mirrors the WooCommerce
-- REST response shape 1:1, same pattern as line_items on orders below;
-- categories are always read/written as a whole with the product, so a
-- join table buys nothing here).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  type text not null default 'simple'
    check (type in ('simple', 'variable', 'grouped', 'external')),
  status text not null default 'publish'
    check (status in ('draft', 'pending', 'private', 'publish')),
  sku text unique,
  price numeric(12,2) not null default 0,
  regular_price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  description text not null default '',
  short_description text not null default '',
  manage_stock boolean not null default true,
  stock_quantity integer,
  stock_status text not null default 'instock'
    check (stock_status in ('instock', 'outofstock', 'onbackorder')),
  weight text default '',
  length text default '',
  width text default '',
  height text default '',
  virtual boolean not null default false,
  downloadable boolean not null default false,
  permalink text default '',
  categories jsonb not null default '[]',   -- [{ id, name, slug }]
  images jsonb not null default '[]',       -- [{ id, src }]
  date_created timestamptz not null default now(),
  date_modified timestamptz not null default now()
);

create index if not exists idx_products_sku on products (sku);
create index if not exists idx_products_status on products (status);
create index if not exists idx_products_type on products (type);

-- ─────────────────────────────────────────────────────────────────────────
-- product_variations
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists product_variations (
  id bigint generated always as identity primary key,
  product_id bigint not null references products (id) on delete cascade,
  sku text unique,
  price numeric(12,2) not null default 0,
  regular_price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  stock_quantity integer,
  stock_status text not null default 'instock'
    check (stock_status in ('instock', 'outofstock', 'onbackorder')),
  attributes jsonb not null default '[]',   -- [{ name, option }]
  image jsonb,                              -- { id, src } | null
  weight text default '',
  date_created timestamptz not null default now(),
  date_modified timestamptz not null default now()
);

create index if not exists idx_variations_product_id on product_variations (product_id);

-- ─────────────────────────────────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists customers (
  id bigint generated always as identity primary key,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  username text not null default '',
  role text not null default 'customer',
  billing jsonb not null default '{}',      -- Address
  shipping jsonb not null default '{}',     -- Address
  date_created timestamptz not null default now(),
  date_modified timestamptz not null default now()
);

create index if not exists idx_customers_email on customers (email);

-- ─────────────────────────────────────────────────────────────────────────
-- orders — line items kept as jsonb (mirrors the WooCommerce REST shape
-- directly, avoids a join table for a field that's always read/written whole)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id bigint generated always as identity primary key,
  number text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed')),
  currency text not null default 'BRL',
  currency_symbol text not null default 'R$',
  date_created timestamptz not null default now(),
  date_modified timestamptz not null default now(),
  discount_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text default '',
  payment_method_title text default '',
  transaction_id text default '',
  customer_id bigint references customers (id) on delete set null,
  billing jsonb not null default '{}',
  shipping jsonb not null default '{}',
  customer_note text not null default '',
  line_items jsonb not null default '[]'
);

create index if not exists idx_orders_customer_id on orders (customer_id);
create index if not exists idx_orders_status on orders (status);
create index if not exists idx_orders_date_created on orders (date_created);

-- ─────────────────────────────────────────────────────────────────────────
-- webhooks
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists webhooks (
  id bigint generated always as identity primary key,
  name text not null default '',
  status text not null default 'active'
    check (status in ('active', 'paused', 'disabled')),
  topic text not null
    check (topic in (
      'product.created', 'product.updated', 'product.deleted',
      'order.created', 'order.updated', 'order.deleted',
      'customer.created', 'customer.updated', 'customer.deleted'
    )),
  delivery_url text not null,
  secret text not null,
  date_created timestamptz not null default now(),
  date_modified timestamptz not null default now()
);

create index if not exists idx_webhooks_topic on webhooks (topic);

-- ─────────────────────────────────────────────────────────────────────────
-- webhook_deliveries — attempt history, trimmed by the app to the newest 300
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists webhook_deliveries (
  id bigint generated always as identity primary key,
  webhook_id bigint not null references webhooks (id) on delete cascade,
  topic text not null,
  url text not null,
  request_headers jsonb not null default '{}',
  request_body text not null default '',
  response_status integer,
  response_body text,
  duration_ms integer not null default 0,
  attempt integer not null default 1,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_webhook_id on webhook_deliveries (webhook_id);
create index if not exists idx_webhook_deliveries_created_at on webhook_deliveries (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- request_logs — Request Inspector feed, trimmed by the app to the newest 500
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists request_logs (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid references credentials (id) on delete set null,
  consumer_key text,
  method text not null,
  path text not null,
  query_params jsonb not null default '{}',
  headers jsonb not null default '{}',      -- Authorization redacted before insert
  request_body jsonb,
  response_status integer not null,
  response_body jsonb,
  duration_ms integer not null default 0,
  ip_address text default '',
  user_agent text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_request_logs_created_at on request_logs (created_at desc);
create index if not exists idx_request_logs_credential_id on request_logs (credential_id);

-- ─────────────────────────────────────────────────────────────────────────
-- date_modified maintenance triggers — fires on any UPDATE so route handlers
-- never need to set it manually.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function set_date_modified()
returns trigger language plpgsql as $$
begin
  new.date_modified = now();
  return new;
end;
$$;

drop trigger if exists trg_products_date_modified on products;
create trigger trg_products_date_modified before update on products
  for each row execute function set_date_modified();

drop trigger if exists trg_variations_date_modified on product_variations;
create trigger trg_variations_date_modified before update on product_variations
  for each row execute function set_date_modified();

drop trigger if exists trg_customers_date_modified on customers;
create trigger trg_customers_date_modified before update on customers
  for each row execute function set_date_modified();

drop trigger if exists trg_orders_date_modified on orders;
create trigger trg_orders_date_modified before update on orders
  for each row execute function set_date_modified();

drop trigger if exists trg_webhooks_date_modified on webhooks;
create trigger trg_webhooks_date_modified before update on webhooks
  for each row execute function set_date_modified();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — deny all by default. The app talks to Supabase with
-- the service_role key (server-side only, never exposed to the browser),
-- which bypasses RLS entirely, so no policy below ever needs to grant access.
-- This block exists purely to stop the anon/public PostgREST API from
-- reading or writing these tables directly.
-- ─────────────────────────────────────────────────────────────────────────
alter table credentials enable row level security;
alter table products enable row level security;
alter table product_variations enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table webhooks enable row level security;
alter table webhook_deliveries enable row level security;
alter table request_logs enable row level security;

-- (no policies created — RLS enabled with zero policies = deny-all for anon/authenticated)

-- ─────────────────────────────────────────────────────────────────────────
-- Seed data — optional starter catalog + 5 access keys. Comment out or
-- delete this block if you don't want them. Everything here is a normal,
-- editable/deletable row — nothing is hardcoded in the application code.
-- ─────────────────────────────────────────────────────────────────────────
insert into credentials (key, secret, secret_hash, secret_preview, permissions, description) values
  ('ck_woobridge_lab_a1b2c3d4e5f60708', 'cs_woobridge_lab_9f8e7d6c5b4a3210', encode(digest('cs_woobridge_lab_9f8e7d6c5b4a3210', 'sha256'), 'hex'), '3210', 'read_write', 'Acesso Principal (leitura e escrita)'),
  ('ck_woobridge_lab_11aa22bb33cc44dd', 'cs_woobridge_lab_dd44cc33bb22aa11', encode(digest('cs_woobridge_lab_dd44cc33bb22aa11', 'sha256'), 'hex'), 'aa11', 'read', 'Acesso Somente Leitura'),
  ('ck_woobridge_lab_55ee66ff77001188', 'cs_woobridge_lab_88110077ff66ee55', encode(digest('cs_woobridge_lab_88110077ff66ee55', 'sha256'), 'hex'), 'ee55', 'write', 'Acesso Somente Escrita'),
  ('ck_woobridge_lab_99aa88bb77cc66dd', 'cs_woobridge_lab_dd66cc77bb88aa99', encode(digest('cs_woobridge_lab_dd66cc77bb88aa99', 'sha256'), 'hex'), 'aa99', 'read_write', 'Acesso ERP / Integração'),
  ('ck_woobridge_lab_2299441166887733', 'cs_woobridge_lab_3377886611442299', encode(digest('cs_woobridge_lab_3377886611442299', 'sha256'), 'hex'), '2299', 'read_write', 'Acesso Testes Automatizados')
on conflict (key) do nothing;

insert into products (name, slug, type, status, sku, price, regular_price, sale_price, description, short_description, stock_quantity, categories, images) values
  ('Camiseta Preta Básica', 'camiseta-preta-basica', 'simple', 'publish', 'SKU-CAM-101', 49.90, 59.90, 49.90, 'Camiseta Preta Básica de alta qualidade, ideal para o dia a dia.', 'Camiseta Preta Básica confortável e durável.', 120, '[{"id":1,"name":"Camisetas","slug":"camisetas"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Camiseta Branca Estampada', 'camiseta-branca-estampada', 'simple', 'publish', 'SKU-CAM-102', 69.90, 69.90, null, 'Camiseta Branca Estampada de alta qualidade, ideal para o dia a dia.', 'Camiseta Branca Estampada confortável e durável.', 80, '[{"id":1,"name":"Camisetas","slug":"camisetas"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Tênis Runner Cinza', 'tenis-runner-cinza', 'simple', 'publish', 'SKU-TEN-103', 199.90, 249.90, 199.90, 'Tênis Runner Cinza de alta qualidade, ideal para o dia a dia.', 'Tênis Runner Cinza confortável e durável.', 40, '[{"id":2,"name":"Calçados","slug":"calcados"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Tênis Casual Branco', 'tenis-casual-branco', 'simple', 'publish', 'SKU-TEN-104', 219.90, 219.90, null, 'Tênis Casual Branco de alta qualidade, ideal para o dia a dia.', 'Tênis Casual Branco confortável e durável.', 55, '[{"id":2,"name":"Calçados","slug":"calcados"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Boné Aba Reta Preto', 'bone-aba-reta-preto', 'simple', 'publish', 'SKU-BON-105', 79.90, 79.90, null, 'Boné Aba Reta Preto de alta qualidade, ideal para o dia a dia.', 'Boné Aba Reta Preto confortável e durável.', 100, '[{"id":3,"name":"Acessórios","slug":"acessorios"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Mochila Executiva Cinza', 'mochila-executiva-cinza', 'simple', 'publish', 'SKU-MOC-106', 159.90, 189.90, 159.90, 'Mochila Executiva Cinza de alta qualidade, ideal para o dia a dia.', 'Mochila Executiva Cinza confortável e durável.', 30, '[{"id":3,"name":"Acessórios","slug":"acessorios"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Moletom Canguru Azul', 'moletom-canguru-azul', 'simple', 'publish', 'SKU-MOL-107', 159.90, 159.90, null, 'Moletom Canguru Azul de alta qualidade, ideal para o dia a dia.', 'Moletom Canguru Azul confortável e durável.', 60, '[{"id":4,"name":"Moletons","slug":"moletons"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]'),
  ('Calça Jogger Preta', 'calca-jogger-preta', 'simple', 'publish', 'SKU-CAL-108', 119.90, 139.90, 119.90, 'Calça Jogger Preta de alta qualidade, ideal para o dia a dia.', 'Calça Jogger Preta confortável e durável.', 70, '[{"id":5,"name":"Calças","slug":"calcas"}]', '[{"id":0,"src":"https://placehold.co/600x400/EEE/31343C"}]')
on conflict (slug) do nothing;
