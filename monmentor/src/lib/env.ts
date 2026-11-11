export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const CHARTER_VERSION = "2026-11";

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const VISIO_BASE_URL = (process.env.VISIO_BASE_URL ?? "https://meet.jit.si").replace(/\/$/, "");
