import { NextResponse } from "next/server";
import { authenticate } from "./auth";
import { WooError } from "./errors";
import { pushLog } from "./db";
import { isoNow } from "./format";
import type { Credential, RequestLog } from "./types";

export interface WooContext {
  cred: Credential;
  params: Record<string, string>;
  url: URL;
  headers: { "X-WP-Total"?: string; "X-WP-TotalPages"?: string };
}

type Handler = (req: Request, ctx: WooContext) => Promise<{ status: number; body: unknown }>;

function redactHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = key.toLowerCase() === "authorization" ? "[REDACTED]" : value;
  });
  return out;
}

export function wooRoute(permission: "read" | "write", handler: Handler) {
  return async (req: Request, routeCtx: { params: Promise<Record<string, string>> }) => {
    const start = Date.now();
    const url = new URL(req.url);
    const params = (await routeCtx.params) ?? {};
    let credentialId: string | null = null;
    let consumerKey: string | null = null;
    let status = 200;
    let responseBody: unknown = null;

    let requestBody: unknown = null;
    try {
      const clone = req.clone();
      const text = await clone.text();
      requestBody = text ? JSON.parse(text) : null;
    } catch {
      requestBody = null;
    }

    const ctx: WooContext = { cred: undefined as unknown as Credential, params, url, headers: {} };

    try {
      const { credential } = authenticate(req, permission);
      ctx.cred = credential;
      credentialId = credential.id;
      consumerKey = credential.key;

      const result = await handler(req, ctx);
      status = result.status;
      responseBody = result.body;

      const res = NextResponse.json(result.body, { status: result.status });
      if (ctx.headers["X-WP-Total"]) res.headers.set("X-WP-Total", ctx.headers["X-WP-Total"]!);
      if (ctx.headers["X-WP-TotalPages"]) res.headers.set("X-WP-TotalPages", ctx.headers["X-WP-TotalPages"]!);

      logRequest();
      return res;
    } catch (err) {
      if (err instanceof WooError) {
        status = err.status;
        responseBody = err.toJSON();
        logRequest();
        return NextResponse.json(err.toJSON(), { status: err.status });
      }
      status = 500;
      responseBody = { code: "woobridge_internal_error", message: (err as Error).message, data: { status: 500 } };
      logRequest();
      return NextResponse.json(responseBody, { status: 500 });
    }

    function logRequest() {
      const log: RequestLog = {
        id: crypto.randomUUID(),
        credential_id: credentialId,
        consumer_key: consumerKey,
        method: req.method,
        path: url.pathname,
        query_params: Object.fromEntries(url.searchParams.entries()),
        headers: redactHeaders(req.headers),
        request_body: requestBody,
        response_status: status,
        response_body: responseBody,
        duration_ms: Date.now() - start,
        ip_address: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
        user_agent: req.headers.get("user-agent") ?? "unknown",
        created_at: isoNow(),
      };
      pushLog(log);
    }
  };
}
