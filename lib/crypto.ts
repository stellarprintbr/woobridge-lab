import { createHash, randomBytes } from "crypto";

export function randomToken(bytes = 20): string {
  return randomBytes(bytes).toString("hex");
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hmacPreview(secret: string): string {
  return secret.slice(-4);
}
