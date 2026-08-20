import { getSafeExternalUrl } from "@/lib/product/external-url";

export type FetchUrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIpv4(part: number, parts: number[]): boolean {
  if (part === 10) return true;
  if (part === 127) return true;
  if (part === 0) return true;
  if (part === 169 && parts[1] === 254) return true;
  if (part === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (part === 192 && parts[1] === 168) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return numbers;
}

export function validateFetchableUrl(input: string): FetchUrlValidationResult {
  const safe = getSafeExternalUrl(input);
  if (!safe) {
    return { ok: false, reason: "URL must use http or https" };
  }

  let parsed: URL;
  try {
    parsed = new URL(safe);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "URL must use http or https" };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: "Local or metadata hosts are not allowed" };
  }

  if (hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return { ok: false, reason: "Local hosts are not allowed" };
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4 && isPrivateIpv4(ipv4[0]!, ipv4)) {
    return { ok: false, reason: "Private IP addresses are not allowed" };
  }

  if (hostname.includes(":") && isPrivateIpv6(hostname)) {
    return { ok: false, reason: "Private IP addresses are not allowed" };
  }

  return { ok: true, url: parsed };
}

export const DEFAULT_FETCH_TIMEOUT_MS = 12_000;
export const DEFAULT_MAX_HTML_BYTES = 1_500_000;
