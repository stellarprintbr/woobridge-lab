import { NextResponse } from "next/server";
import { listRequestLogs, listWebhookDeliveries, listProducts, listOrders, listCustomers, listWebhooks } from "@/lib/repo";

export async function GET() {
  const [logs, deliveries, products, orders, customers, webhooks] = await Promise.all([
    listRequestLogs(),
    listWebhookDeliveries(),
    listProducts(),
    listOrders(),
    listCustomers(),
    listWebhooks(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const requestsToday = logs.filter((l) => l.created_at.startsWith(today)).length;
  const successful = logs.filter((l) => l.response_status < 400).length;
  const failed = logs.filter((l) => l.response_status >= 400).length;

  const statusBuckets: Record<string, number> = {};
  for (const l of logs) {
    const bucket = `${Math.floor(l.response_status / 100)}xx`;
    statusBuckets[bucket] = (statusBuckets[bucket] ?? 0) + 1;
  }

  const durations = logs.map((l) => l.duration_ms).sort((a, b) => a - b);
  const avgLatency = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const p95Latency = durations.length ? durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1] : 0;

  const totalDeliveries = deliveries.length;
  const successDeliveries = deliveries.filter((d) => d.success).length;

  return NextResponse.json({
    totalRequests: logs.length,
    requestsToday,
    successful,
    failed,
    products: products.length,
    orders: orders.length,
    customers: customers.length,
    webhooks: webhooks.length,
    statusBuckets,
    avgLatency,
    p95Latency,
    webhookSuccessRate: totalDeliveries ? Math.round((successDeliveries / totalDeliveries) * 100) : 100,
    recent: logs.slice(0, 8),
  });
}
