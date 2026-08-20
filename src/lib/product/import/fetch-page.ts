import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_MAX_HTML_BYTES,
  validateFetchableUrl,
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

export async function fetchProductPageHtml(
  inputUrl: string,
  options?: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxBytes?: number;
  },
): Promise<FetchHtmlResult> {
  const validation = validateFetchableUrl(inputUrl);
  if (!validation.ok) {
    throw new WebFetchError(validation.reason);
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_HTML_BYTES;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(validation.url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ProjectGarageProductImportBot/1.0",
      },
    });

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

    const finalUrl =
      response.url && response.url.trim() ? response.url : validation.url.toString();
    const finalValidation = validateFetchableUrl(finalUrl);
    if (!finalValidation.ok) {
      throw new WebFetchError(`Redirect target is not allowed: ${finalValidation.reason}`);
    }

    return {
      finalUrl: finalValidation.url.toString(),
      html: new TextDecoder("utf-8").decode(buffer),
      fetchedAt: new Date().toISOString(),
    };
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

export async function fetchAndExtractRawWebData(
  inputUrl: string,
  options?: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxBytes?: number;
  },
) {
  const fetched = await fetchProductPageHtml(inputUrl, options);
  return extractRawWebData(fetched.html, fetched.finalUrl, fetched.fetchedAt);
}
