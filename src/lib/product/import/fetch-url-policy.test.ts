import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_FETCH_TIMEOUT_MS,
  isBlockedIpAddress,
  validateFetchableUrl,
  validateFetchTarget,
  validateResolvedAddresses,
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

  it("rejects metadata hostnames", () => {
    expect(validateFetchableUrl("http://metadata.google.internal/computeMetadata/v1/").ok).toBe(
      false,
    );
  });

  it("rejects metadata endpoint IP literals", () => {
    expect(validateFetchableUrl("http://169.254.169.254/latest/meta-data/").ok).toBe(false);
  });

  it("uses safe default timeout constant", () => {
    expect(DEFAULT_FETCH_TIMEOUT_MS).toBeGreaterThan(0);
  });
});

describe("validateResolvedAddresses", () => {
  it("rejects loopback and private resolved addresses", async () => {
    await expect(
      validateResolvedAddresses("shop.example.com", vi.fn(async () => [{ address: "127.0.0.1", family: 4 }])),
    ).resolves.toEqual({
      ok: false,
      reason: "Resolved address 127.0.0.1 is not allowed",
    });

    await expect(
      validateResolvedAddresses(
        "shop.example.com",
        vi.fn(async () => [{ address: "10.0.0.5", family: 4 }]),
      ),
    ).resolves.toEqual({
      ok: false,
      reason: "Resolved address 10.0.0.5 is not allowed",
    });

    await expect(
      validateResolvedAddresses(
        "shop.example.com",
        vi.fn(async () => [{ address: "169.254.169.254", family: 4 }]),
      ),
    ).resolves.toEqual({
      ok: false,
      reason: "Resolved address 169.254.169.254 is not allowed",
    });
  });

  it("accepts public resolved addresses", async () => {
    await expect(
      validateResolvedAddresses(
        "shop.example.com",
        vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
      ),
    ).resolves.toEqual({ ok: true });
  });
});

describe("validateFetchTarget", () => {
  it("combines URL and DNS validation", async () => {
    const result = await validateFetchTarget(
      "https://shop.example.com/products/1",
      vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
    );

    expect(result.ok).toBe(true);
  });
});

describe("isBlockedIpAddress", () => {
  it("blocks loopback, private, link-local, and metadata IPs", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("192.168.1.1")).toBe(true);
    expect(isBlockedIpAddress("169.254.10.5")).toBe(true);
    expect(isBlockedIpAddress("169.254.169.254")).toBe(true);
    expect(isBlockedIpAddress("::1")).toBe(true);
    expect(isBlockedIpAddress("fc00::1")).toBe(true);
    expect(isBlockedIpAddress("fe80::1")).toBe(true);
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
  });
});
