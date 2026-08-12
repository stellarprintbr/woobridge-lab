import { NextResponse } from "next/server";
import { resetStore } from "@/lib/db";

export async function POST() {
  resetStore();
  return NextResponse.json({ ok: true });
}
