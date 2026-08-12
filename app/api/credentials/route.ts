import { NextResponse } from "next/server";
import { listCredentials, createCredential } from "@/lib/repo";
import { randomToken, sha256 } from "@/lib/crypto";
import type { Permission } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await listCredentials());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const permissions: Permission = body.permissions ?? "read_write";
  const description: string = body.description ?? "";

  const key = `ck_${randomToken(20)}`;
  const secret = `cs_${randomToken(20)}`;

  const credential = await createCredential({
    key,
    secret,
    secretHash: sha256(secret),
    secretPreview: secret.slice(-4),
    permissions,
    description,
  });

  return NextResponse.json(credential, { status: 201 });
}
