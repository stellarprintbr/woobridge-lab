import { NextResponse } from "next/server";
import { listCustomers, createCustomer } from "@/lib/repo";
import { dispatchEvent } from "@/lib/webhooks";
import type { Customer } from "@/lib/types";

export async function GET() {
  const customers = await listCustomers();
  return NextResponse.json([...customers].sort((a, b) => b.id - a.id));
}

export async function POST(req: Request) {
  const payload: Partial<Customer> = await req.json().catch(() => ({}));
  if (!payload.email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const customer = await createCustomer(payload as { email: string });
  dispatchEvent("customer.created", customer);
  return NextResponse.json(customer, { status: 201 });
}
