const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const VERCEL_PREVIEW_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

/** Production deployment origin (Vercel). */
export const PRODUCTION_APP_ORIGIN = "https://project-garage-lyart.vercel.app";

function parseAllowedOriginsFromEnv(): string[] {
  const raw = process.env.AUTH_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isAllowedAuthOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  const normalized = parsed.origin;

  if (LOCALHOST_ORIGIN_PATTERN.test(normalized)) {
    return true;
  }

  if (normalized === PRODUCTION_APP_ORIGIN) {
    return true;
  }

  if (VERCEL_PREVIEW_ORIGIN_PATTERN.test(normalized)) {
    return true;
  }

  return parseAllowedOriginsFromEnv().includes(normalized);
}

export function resolveAuthRedirectOrigin(
  clientOrigin: string | undefined,
  serverOrigin: string,
): string | null {
  if (clientOrigin && isAllowedAuthOrigin(clientOrigin)) {
    return new URL(clientOrigin).origin;
  }

  if (isAllowedAuthOrigin(serverOrigin)) {
    return new URL(serverOrigin).origin;
  }

  return null;
}

export function buildAuthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}
