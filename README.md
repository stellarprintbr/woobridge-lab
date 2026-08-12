# WooBridge Lab

Laboratório de compatibilidade com a REST API v3 do WooCommerce (`wc/v3`). Permite gerar credenciais,
criar produtos/pedidos/clientes/webhooks e observar em tempo real como um ERP externo interage com a API.

**Sem banco de dados real** — todos os dados vivem em memória (`lib/db.ts`) e são resetados quando o
processo do servidor reinicia. É proposital: o objetivo é validar o contrato HTTP, não persistência.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/dashboard` e use o **Setup Wizard** (`/dashboard/wizard`) para popular
dados demo, gerar credenciais e testar a conexão de ponta a ponta.

## Estrutura

- `app/wp-json/wc/v3/*` — API pública compatível com WooCommerce (Basic Auth com `ck_`/`cs_`).
- `app/api/*` — API interna do dashboard (credenciais, logs, seed, stats).
- `app/dashboard/*` — painel administrativo (Next.js App Router, Tailwind, dark mode).
- `lib/` — auth, store em memória, formatação, webhooks (HMAC + retry), seed de dados BR.

## Deploy

Projeto pronto para deploy na Vercel (`vercel deploy`). Como não há banco de dados, os dados de teste
resetam a cada novo deploy/reinício da função serverless.
