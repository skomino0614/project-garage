import { describe, expect, it } from "vitest";

import { getSafeExternalUrl, isSafeExternalUrl } from "./external-url";

describe("external URL safety", () => {
  it("accepts https URLs", () => {
    expect(isSafeExternalUrl("https://example.com/product")).toBe(true);
    expect(getSafeExternalUrl("https://example.com/product")).toBe("https://example.com/product");
  });

  it("accepts http URLs", () => {
    expect(isSafeExternalUrl("http://example.com/product")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isSafeExternalUrl("")).toBe(false);
    expect(isSafeExternalUrl("   ")).toBe(false);
    expect(getSafeExternalUrl("")).toBeNull();
  });

  it("rejects non-http protocols", () => {
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("ftp://example.com/file")).toBe(false);
    expect(isSafeExternalUrl("data:text/plain,hello")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isSafeExternalUrl("not-a-url")).toBe(false);
    expect(getSafeExternalUrl("not-a-url")).toBeNull();
  });

  it("rejects null and undefined", () => {
    expect(isSafeExternalUrl(null)).toBe(false);
    expect(isSafeExternalUrl(undefined)).toBe(false);
  });
});
