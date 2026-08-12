import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { isoNow } from "@/lib/format";
import type { Credential, Permission } from "@/lib/types";

function publicView(c: Credential) {
  return {
    id: c.id,
    key: c.key,
    // Fixed demo credentials are never masked — this is a test lab, the secret is
    // meant to be visible and reused, not hidden after a one-time reveal.
    secretPreview: c.fixed ? c.secret! : `cs_${"*".repeat(12)}${c.secretPreview}`,
    fixed: !!c.fixed,
    permissions: c.permissions,
    description: c.description,
    created_at: c.created_at,
    last_used_at: c.last_used_at,
    revoked_at: c.revoked_at,
  };
}

export async function GET() {
  return NextResponse.json(db.credentials.map(publicView));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const permissions: Permission = body.permissions ?? "read_write";
  const description: string = body.description ?? "";

  const key = `ck_${randomToken(20)}`;
  const secret = `cs_${randomToken(20)}`;

  const credential: Credential = {
    id: crypto.randomUUID(),
    key,
    secretHash: sha256(secret),
    secretPreview: secret.slice(-4),
    permissions,
    description,
    created_at: isoNow(),
    last_used_at: null,
    revoked_at: null,
  };
  db.credentials.push(credential);

  // Secret is only ever returned here, at creation time.
  return NextResponse.json({ ...publicView(credential), secret }, { status: 201 });
}
