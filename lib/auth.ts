import { db } from "./db";
import { sha256 } from "./crypto";
import { Errors } from "./errors";
import type { Credential, Permission } from "./types";
import { isoNow } from "./format";

export interface AuthResult {
  credential: Credential;
}

function decodeBasicAuth(header: string): { key: string; secret: string } | null {
  if (!header.toLowerCase().startsWith("basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return { key: decoded.slice(0, idx), secret: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export function authenticate(req: Request, requiredPermission: "read" | "write"): AuthResult {
  const url = new URL(req.url);
  let key: string | null = null;
  let secret: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const decoded = decodeBasicAuth(authHeader);
    if (decoded) {
      key = decoded.key;
      secret = decoded.secret;
    }
  }

  if (!key) {
    key = url.searchParams.get("consumer_key");
    secret = url.searchParams.get("consumer_secret");
  }

  if (!key || secret === null) {
    throw Errors.authRequired();
  }

  const credential = db.credentials.find((c) => c.key === key);
  if (!credential) throw Errors.authInvalid();
  if (credential.revoked_at) throw Errors.authInvalid();
  if (credential.secretHash !== sha256(secret)) throw Errors.authInvalid();

  if (!hasPermission(credential.permissions, requiredPermission)) {
    throw requiredPermission === "read" ? Errors.cannotView() : Errors.cannotEdit();
  }

  credential.last_used_at = isoNow();

  return { credential };
}

function hasPermission(granted: Permission, required: "read" | "write"): boolean {
  if (granted === "read_write") return true;
  return granted === required;
}
