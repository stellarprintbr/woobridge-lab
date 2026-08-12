import { createHmac } from "crypto";
import { db, nextId } from "./db";
import { isoNow } from "./format";
import type { WebhookTopic, WebhookDelivery } from "./types";

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 500, 1500];

export async function dispatchEvent(topic: WebhookTopic, resource: unknown) {
  const matching = db.webhooks.filter((w) => w.topic === topic && w.status === "active");
  for (const webhook of matching) {
    fireWithRetry(webhook.id, topic, webhook.delivery_url, webhook.secret, resource).catch(() => {});
  }
}

async function fireWithRetry(
  webhookId: number,
  topic: WebhookTopic,
  url: string,
  secret: string,
  resource: unknown
) {
  const body = JSON.stringify(resource);
  const signature = createHmac("sha256", secret).update(body).digest("base64");
  const deliveryId = crypto.randomUUID();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-WC-Webhook-Topic": topic,
    "X-WC-Webhook-Resource": topic.split(".")[0],
    "X-WC-Webhook-Event": topic.split(".")[1],
    "X-WC-Webhook-Signature": signature,
    "X-WC-Webhook-Delivery-ID": deliveryId,
    "User-Agent": "WooBridge-Lab-Hookshot/1.0",
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1]) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
    }
    const start = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
      responseStatus = res.status;
      responseBody = await res.text().catch(() => "");
      success = res.status >= 200 && res.status < 300;
    } catch (err) {
      responseBody = `Delivery failed: ${(err as Error).message}`;
    }

    const delivery: WebhookDelivery = {
      id: nextId("delivery"),
      webhook_id: webhookId,
      topic,
      url,
      request_headers: headers,
      request_body: body,
      response_status: responseStatus,
      response_body: responseBody,
      duration_ms: Date.now() - start,
      attempt,
      success,
      created_at: isoNow(),
    };
    db.webhookDeliveries.unshift(delivery);
    if (db.webhookDeliveries.length > 300) db.webhookDeliveries.length = 300;

    if (success) return;
  }
}
