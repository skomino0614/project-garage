import { describe, expect, it } from "vitest";

import {
  DEFAULT_FETCH_TIMEOUT_MS,
  validateFetchableUrl,
} from "./fetch-url-policy";

describe("validateFetchableUrl", () => {
  it("accepts valid https URLs", () => {
    expect(validateFetchableUrl("https://shop.example.com/products/1")).toEqual({
      ok: true,
      url: new URL("https://shop.example.com/products/1"),
    });
  });

  it("rejects javascript URLs", () => {
    expect(validateFetchableUrl("javascript:alert(1)").ok).toBe(false);
  });

  it("rejects data URLs", () => {
    expect(validateFetchableUrl("data:text/html,hello").ok).toBe(false);
  });

  it("rejects file URLs", () => {
    expect(validateFetchableUrl("file:///etc/passwd").ok).toBe(false);
  });

  it("rejects localhost", () => {
    expect(validateFetchableUrl("http://localhost:3000/product").ok).toBe(false);
  });

  it("rejects private IPv4 addresses", () => {
    expect(validateFetchableUrl("http://192.168.0.10/item").ok).toBe(false);
    expect(validateFetchableUrl("http://10.0.0.5/item").ok).toBe(false);
    expect(validateFetchableUrl("http://127.0.0.1/item").ok).toBe(false);
  });

  it("uses safe default timeout constant", () => {
    expect(DEFAULT_FETCH_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
