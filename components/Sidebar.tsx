"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    heading: null,
    items: [{ href: "/dashboard", label: "Painel" }],
  },
  {
    heading: "API",
    items: [
      { href: "/dashboard/requests", label: "Requisições" },
      { href: "/dashboard/playground", label: "Playground" },
      { href: "/dashboard/docs", label: "Documentação" },
      { href: "/dashboard/api-status", label: "Status da API" },
      { href: "/dashboard/tests", label: "Testes" },
    ],
  },
  {
    heading: "Loja",
    items: [
      { href: "/dashboard/products", label: "Produtos" },
      { href: "/dashboard/orders", label: "Pedidos" },
      { href: "/dashboard/customers", label: "Clientes" },
      { href: "/dashboard/webhooks", label: "Webhooks" },
    ],
  },
  {
    heading: "Integração",
    items: [
      { href: "/dashboard/credentials", label: "Credenciais" },
      { href: "/dashboard/erp-simulator", label: "Simulador de ERP" },
      { href: "/dashboard/wizard", label: "Assistente de Configuração" },
    ],
  },
  {
    heading: "Sistema",
    items: [{ href: "/dashboard/debug", label: "Console de Debug" }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple/20 border border-purple/40 flex items-center justify-center text-purple text-xs font-bold">
            W
          </div>
          <span className="font-semibold text-sm">WooBridge Lab</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green" />
          API Online
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            {section.heading && (
              <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                {section.heading}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                      active ? "bg-white/10 text-text" : "text-text-muted hover:bg-white/5 hover:text-text"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-border text-[11px] text-text-muted mono">
        /wp-json/wc/v3/
      </div>
    </aside>
  );
}
