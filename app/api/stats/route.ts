import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const requestsToday = db.logs.filter((l) => l.created_at.startsWith(today)).length;
  const successful = db.logs.filter((l) => l.response_status < 400).length;
  const failed = db.logs.filter((l) => l.response_status >= 400).length;

  const statusBuckets: Record<string, number> = {};
  for (const l of db.logs) {
    const bucket = `${Math.floor(l.response_status / 100)}xx`;
    statusBuckets[bucket] = (statusBuckets[bucket] ?? 0) + 1;
  }

  const durations = db.logs.map((l) => l.duration_ms).sort((a, b) => a - b);
  const avgLatency = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const p95Latency = durations.length ? durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1] : 0;

  const totalDeliveries = db.webhookDeliveries.length;
  const successDeliveries = db.webhookDeliveries.filter((d) => d.success).length;

  return NextResponse.json({
    totalRequests: db.logs.length,
    requestsToday,
    successful,
    failed,
    products: db.products.length,
    orders: db.orders.length,
    customers: db.customers.length,
    webhooks: db.webhooks.length,
    statusBuckets,
    avgLatency,
    p95Latency,
    webhookSuccessRate: totalDeliveries ? Math.round((successDeliveries / totalDeliveries) * 100) : 100,
    recent: db.logs.slice(0, 8),
  });
}
