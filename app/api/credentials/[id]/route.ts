import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isoNow } from "@/lib/format";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const credential = db.credentials.find((c) => c.id === id);
  if (!credential) return NextResponse.json({ error: "not found" }, { status: 404 });
  credential.revoked_at = isoNow();
  return NextResponse.json({ ok: true });
}
