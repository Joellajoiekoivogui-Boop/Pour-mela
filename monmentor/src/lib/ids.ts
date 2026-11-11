import { randomBytes, createHash } from "node:crypto";

export const newId = () => randomBytes(12).toString("base64url");
export const newToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "membre";
}

/** Code de certificat lisible, imprimé et dans le QR code : MM-2026-7K3Q9P. */
export function certificateCode(year = new Date().getFullYear()): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O ni 1/I/L
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `MM-${year}-${out}`;
}
