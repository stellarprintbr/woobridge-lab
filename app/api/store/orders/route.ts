import { NextResponse } from "next/server";
import { listOrders } from "@/lib/repo";

export async function GET() {
  const orders = await listOrders();
  return NextResponse.json([...orders].sort((a, b) => b.id - a.id));
}
