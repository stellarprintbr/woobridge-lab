import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  let items = db.logs;

  const method = url.searchParams.get("method");
  if (method) items = items.filter((l) => l.method === method);

  const status = url.searchParams.get("status");
  if (status) items = items.filter((l) => String(l.response_status) === status);

  const q = url.searchParams.get("q");
  if (q) items = items.filter((l) => l.path.includes(q));

  const limit = Number(url.searchParams.get("limit") ?? 100);
  return NextResponse.json(items.slice(0, limit));
}
