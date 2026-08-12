import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key, secret } = await req.json().catch(() => ({ key: "", secret: "" }));
  const origin = new URL(req.url).origin;
  const start = Date.now();
  try {
    const res = await fetch(`${origin}/wp-json/wc/v3/products?per_page=1`, {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
      cache: "no-store",
    });
    const duration = Date.now() - start;
    const body = await res.json().catch(() => null);
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      duration_ms: duration,
      message: res.ok ? "Connected. Authentication valid. Products endpoint available." : body?.message ?? "Connection failed.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, status: 0, duration_ms: Date.now() - start, message: (err as Error).message });
  }
}
