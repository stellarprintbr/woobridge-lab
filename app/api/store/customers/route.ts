import { NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";
import { isoNow } from "@/lib/format";
import { dispatchEvent } from "@/lib/webhooks";
import type { Customer } from "@/lib/types";

export async function GET() {
  return NextResponse.json([...db.customers].sort((a, b) => b.id - a.id));
}

export async function POST(req: Request) {
  const payload: Partial<Customer> = await req.json().catch(() => ({}));
  if (!payload.email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const now = isoNow();
  const id = nextId("customer");
  const customer: Customer = {
    id,
    email: payload.email,
    first_name: payload.first_name ?? "",
    last_name: payload.last_name ?? "",
    username: payload.username ?? payload.email.split("@")[0],
    role: "customer",
    billing: payload.billing ?? ({} as Customer["billing"]),
    shipping: payload.shipping ?? ({} as Customer["shipping"]),
    date_created: now,
    date_modified: now,
  };
  db.customers.push(customer);
  dispatchEvent("customer.created", customer);
  return NextResponse.json(customer, { status: 201 });
}
