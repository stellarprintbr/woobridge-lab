import { NextResponse } from "next/server";
import { seedDemoStore } from "@/lib/seed";

export async function POST() {
  const summary = await seedDemoStore();
  return NextResponse.json({ ok: true, summary });
}
