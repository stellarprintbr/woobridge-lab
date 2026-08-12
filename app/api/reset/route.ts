import { NextResponse } from "next/server";
import { resetStore } from "@/lib/seed";

export async function POST() {
  await resetStore();
  return NextResponse.json({ ok: true });
}
