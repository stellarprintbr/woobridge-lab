# WooBridge Lab

Laboratório de compatibilidade com a REST API v3 do WooCommerce (`wc/v3`). Permite gerar credenciais,
criar produtos/pedidos/clientes/webhooks e observar em tempo real como um ERP externo interage com a API.

**Banco de dados: Supabase (Postgres).** Todos os dados (produtos, variações, clientes, pedidos,
webhooks, entregas de webhook, credenciais e o log de requisições) são persistidos em tabelas reais —
veja `supabase/schema.sql`. Nada fica hardcoded no código.

## Configuração do Supabase

1. Rode `supabase/schema.sql` no seu projeto (SQL Editor ou `supabase db push`). Ele cria as tabelas,
   índices, triggers de `date_modified`, RLS (deny-all para anon/public) e uma seção de seed opcional
   com um catálogo inicial de produtos e 5 credenciais de teste.
2. Configure as variáveis de ambiente (local: `.env.local`; produção: Vercel → Project Settings →
   Environment Variables):

```bash
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role, nunca a anon key — fica só no servidor
```

O `service_role` key bypassa RLS; é assim que as rotas do Next.js (rodando no servidor) acessam os
dados. Nunca exponha essa chave no cliente (sem prefixo `NEXT_PUBLIC_`).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/dashboard` e use o **Setup Wizard** (`/dashboard/wizard`) para popular
dados demo, gerar credenciais e testar a conexão de ponta a ponta.

## Estrutura

- `app/wp-json/wc/v3/*` — API pública compatível com WooCommerce (Basic Auth com `ck_`/`cs_`).
- `app/wc-api/v2|v3/*` — shim para o namespace legado do WooCommerce (endpoints `count`), removido do
  WooCommerce real desde a versão 3.0 mas ainda usado por alguns ERPs mais antigos.
- `app/api/*` — API interna do dashboard (credenciais, logs, seed, stats).
- `app/dashboard/*` — painel administrativo (Next.js App Router, Tailwind, dark mode).
- `lib/supabase.ts` — client server-side (service_role).
- `lib/repo.ts` — camada de acesso a dados (mapeamento linha↔tipo, CRUD por recurso).
- `lib/` — auth, formatação, webhooks (HMAC + retry), seed de dados demo BR.
- `supabase/schema.sql` — schema completo + seed opcional.

## Deploy

Projeto pronto para deploy na Vercel (`vercel deploy`). Configure `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` nas variáveis de ambiente do projeto na Vercel antes do deploy — sem elas,
qualquer rota que acesse dados retorna 500.
