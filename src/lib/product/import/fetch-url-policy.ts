import { isIP } from "node:net";
import dns from "node:dns/promises";

import { getSafeExternalUrl } from "@/lib/product/external-url";

export type FetchUrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export type AddressValidationResult = { ok: true } | { ok: false; reason: string };

export type DnsLookupFn = (
  hostname: string,
  options: { all: true },
) => Promise<Array<{ address: string; family: number }>>;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "metadata.google",
]);

const METADATA_IPV4 = "169.254.169.254";

function isPrivateIpv4Part(part: number, parts: number[]): boolean {
  if (part === 10) return true;
  if (part === 127) return true;
  if (part === 0) return true;
  if (part === 169 && parts[1] === 254) return true;
  if (part === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (part === 192 && parts[1] === 168) return true;
  return false;
}

function parseIpv4Literal(address: string): number[] | null {
  const parts = address.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return numbers;
}

function normalizeIpv6(address: string): string {
  return address.toLowerCase().replace(/^\[(.*)\]$/, "$1");
}

function parseIpv4MappedIpv6(address: string): string | null {
  const normalized = normalizeIpv6(address);

  if (normalized.startsWith("::ffff:")) {
    const suffix = normalized.slice("::ffff:".length);
    const dotted = parseIpv4Literal(suffix);
    if (dotted) {
      return suffix;
    }

    const hexParts = suffix.split(":");
    if (hexParts.length === 2) {
      const hi = Number.parseInt(hexParts[0] ?? "", 16);
      const lo = Number.parseInt(hexParts[1] ?? "", 16);
      if (
        Number.isInteger(hi) &&
        Number.isInteger(lo) &&
        hi >= 0 &&
        hi <= 0xffff &&
        lo >= 0 &&
        lo <= 0xffff
      ) {
        return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      }
    }
  }

  const fullFormMatch = normalized.match(/(?:0+:)+ffff:(.+)$/);
  if (fullFormMatch?.[1]) {
    const suffix = fullFormMatch[1];
    if (parseIpv4Literal(suffix)) {
      return suffix;
    }
  }

  return null;
}

function isBlockedIpv4Literal(address: string): boolean {
  if (address === METADATA_IPV4) {
    return true;
  }

  const ipv4 = parseIpv4Literal(address);
  return ipv4 ? isPrivateIpv4Part(ipv4[0]!, ipv4) : true;
}

function isPrivateIpv6Literal(address: string): boolean {
  const normalized = normalizeIpv6(address);

  if (normalized === "::" || normalized === "::1") {
    return true;
  }

  if (normalized.startsWith("fe80:")) {
    return true;
  }

  const firstHextet = normalized.split(":")[0] ?? "";
  if (firstHextet.startsWith("fc") || firstHextet.startsWith("fd")) {
    return true;
  }

  const mappedIpv4 = parseIpv4MappedIpv6(normalized);
  if (mappedIpv4) {
    return isBlockedIpv4Literal(mappedIpv4);
  }

  return false;
}

export function isBlockedIpAddress(address: string): boolean {
  const normalized = address.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    return isBlockedIpv4Literal(normalized);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6Literal(normalized);
  }

  return true;
}

function isPrivateIpv6Hostname(hostname: string): boolean {
  const normalized = normalizeIpv6(hostname);
  return isPrivateIpv6Literal(normalized);
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

  const ipv4 = parseIpv4Literal(hostname);
  if (ipv4 && isPrivateIpv4Part(ipv4[0]!, ipv4)) {
    return { ok: false, reason: "Private IP addresses are not allowed" };
  }

  if (hostname.includes(":") && isPrivateIpv6Hostname(hostname)) {
    return { ok: false, reason: "Private IP addresses are not allowed" };
  }

  if (isIP(hostname) && isBlockedIpAddress(hostname)) {
    return { ok: false, reason: "Private IP addresses are not allowed" };
  }

  return { ok: true, url: parsed };
}

export async function validateResolvedAddresses(
  hostname: string,
  lookup: DnsLookupFn = dns.lookup,
): Promise<AddressValidationResult> {
  const normalizedHost = hostname.trim().toLowerCase();
  if (!normalizedHost) {
    return { ok: false, reason: "Missing hostname" };
  }

  if (isIP(normalizedHost)) {
    return isBlockedIpAddress(normalizedHost)
      ? { ok: false, reason: `Resolved address ${normalizedHost} is not allowed` }
      : { ok: true };
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(normalizedHost, { all: true });
  } catch {
    return { ok: false, reason: "Failed to resolve hostname" };
  }

  if (addresses.length === 0) {
    return { ok: false, reason: "Failed to resolve hostname" };
  }

  for (const entry of addresses) {
    if (isBlockedIpAddress(entry.address)) {
      return { ok: false, reason: `Resolved address ${entry.address} is not allowed` };
    }
  }

  return { ok: true };
}

export async function validateFetchTarget(
  input: string,
  lookup?: DnsLookupFn,
): Promise<FetchUrlValidationResult> {
  const urlValidation = validateFetchableUrl(input);
  if (!urlValidation.ok) {
    return urlValidation;
  }

  const addressValidation = await validateResolvedAddresses(urlValidation.url.hostname, lookup);
  if (!addressValidation.ok) {
    return { ok: false, reason: addressValidation.reason };
  }

  return urlValidation;
}

export const DEFAULT_FETCH_TIMEOUT_MS = 12_000;
export const DEFAULT_MAX_HTML_BYTES = 1_500_000;
export const DEFAULT_MAX_REDIRECTS = 5;

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUS_CODES.has(status);
}

export function resolveRedirectUrl(currentUrl: string, location: string): string {
  return new URL(location, currentUrl).toString();
}
