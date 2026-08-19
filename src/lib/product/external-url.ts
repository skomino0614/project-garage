/** Returns true when the value is a non-empty http(s) URL. */
export function isSafeExternalUrl(url: string | null | undefined): url is string {
  if (typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Normalizes external URLs to safe http(s) links, otherwise null. */
export function getSafeExternalUrl(url: string | null | undefined): string | null {
  return isSafeExternalUrl(url) ? url.trim() : null;
}
