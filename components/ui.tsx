import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-lg ${className}`}>{children}</div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div>
        <h3 className="text-sm font-medium text-text">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  green: "bg-green/10 text-green border-green/30",
  yellow: "bg-yellow/10 text-yellow border-yellow/30",
  red: "bg-red/10 text-red border-red/30",
  blue: "bg-blue/10 text-blue border-blue/30",
  purple: "bg-purple/10 text-purple border-purple/30",
  gray: "bg-white/5 text-text-muted border-border",
};

export function Badge({ color = "gray", children }: { color?: keyof typeof badgeColors; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeColors[color]}`}>
      {children}
    </span>
  );
}

export function methodColor(method: string): keyof typeof badgeColors {
  switch (method) {
    case "GET":
      return "blue";
    case "POST":
      return "green";
    case "PUT":
      return "yellow";
    case "DELETE":
      return "red";
    default:
      return "gray";
  }
}

export function statusColor(status: number): keyof typeof badgeColors {
  if (status < 300) return "green";
  if (status < 400) return "blue";
  if (status < 500) return "yellow";
  return "red";
}

export function orderStatusColor(status: string): keyof typeof badgeColors {
  switch (status) {
    case "completed":
      return "green";
    case "processing":
      return "blue";
    case "pending":
    case "on-hold":
      return "yellow";
    case "cancelled":
    case "failed":
      return "red";
    case "refunded":
      return "purple";
    default:
      return "gray";
  }
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const variants = {
    primary: "bg-blue text-white hover:bg-blue/90",
    secondary: "bg-white/5 text-text border border-border hover:bg-white/10",
    danger: "bg-red/10 text-red border border-red/30 hover:bg-red/20",
  };
  return (
    <button
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="mono text-xs bg-black/30 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words text-text-muted">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
