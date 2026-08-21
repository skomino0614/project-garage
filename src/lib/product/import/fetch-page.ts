import dns from "node:dns/promises";

import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_MAX_HTML_BYTES,
  DEFAULT_MAX_REDIRECTS,
  isRedirectStatus,
  resolveRedirectUrl,
  validateFetchTarget,
  validateResolvedAddresses,
  type DnsLookupFn,
} from "./fetch-url-policy";
import { extractRawWebData } from "./html-extract";

export class WebFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebFetchError";
  }
}

export type FetchHtmlResult = {
  finalUrl: string;
  html: string;
  fetchedAt: string;
};

type FetchPageOptions = {
  fetchImpl?: typeof fetch;
  lookup?: DnsLookupFn;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
};

async function fetchSingleHop(
  url: string,
  options: {
    fetchImpl: typeof fetch;
    lookup: DnsLookupFn;
    signal: AbortSignal;
  },
): Promise<Response> {
  const validation = await validateFetchTarget(url, options.lookup);
  if (!validation.ok) {
    throw new WebFetchError(validation.reason);
  }

  return options.fetchImpl(validation.url.toString(), {
    method: "GET",
    redirect: "manual",
    signal: options.signal,
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "ProjectGarageProductImportBot/1.0",
    },
  });
}

export async function fetchProductPageHtml(
  inputUrl: string,
  options?: FetchPageOptions,
): Promise<FetchHtmlResult> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const lookup = options?.lookup ?? dns.lookup;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_HTML_BYTES;
  const maxRedirects = options?.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let currentUrl = inputUrl;

  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const response = await fetchSingleHop(currentUrl, {
        fetchImpl,
        lookup,
        signal: controller.signal,
      });

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get("location");
        if (!location?.trim()) {
          throw new WebFetchError("Redirect response is missing Location header");
        }

        if (hop >= maxRedirects) {
          throw new WebFetchError("Too many redirects");
        }

        currentUrl = resolveRedirectUrl(currentUrl, location);
        continue;
      }

      if (!response.ok) {
        throw new WebFetchError(`Failed to fetch page (${response.status})`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new WebFetchError("Response is not HTML");
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > maxBytes) {
        throw new WebFetchError("Response exceeds maximum allowed size");
      }

      const finalValidation = await validateFetchTarget(currentUrl, lookup);
      if (!finalValidation.ok) {
        throw new WebFetchError(`Redirect target is not allowed: ${finalValidation.reason}`);
      }

      return {
        finalUrl: finalValidation.url.toString(),
        html: new TextDecoder("utf-8").decode(buffer),
        fetchedAt: new Date().toISOString(),
      };
    }

    throw new WebFetchError("Too many redirects");
  } catch (error) {
    if (error instanceof WebFetchError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new WebFetchError("Fetch timed out");
    }

    throw new WebFetchError(error instanceof Error ? error.message : "Fetch failed");
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAndExtractRawWebData(inputUrl: string, options?: FetchPageOptions) {
  const fetched = await fetchProductPageHtml(inputUrl, options);
  return extractRawWebData(fetched.html, fetched.finalUrl, fetched.fetchedAt);
}
