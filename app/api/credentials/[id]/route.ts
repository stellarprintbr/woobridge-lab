import { NextResponse } from "next/server";
import { revokeCredential } from "@/lib/repo";
import { isoNow } from "@/lib/format";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const credential = await revokeCredential(id, isoNow());
  if (!credential) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
