import { describe, expect, it, vi } from "vitest";

import { fetchProductPageHtml, WebFetchError } from "./fetch-page";

const safeLookup = vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]);

describe("fetchProductPageHtml SSRF protections", () => {
  it("rejects public URL redirecting to localhost", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "http://127.0.0.1/private" },
        }),
      );

    await expect(
      fetchProductPageHtml("https://shop.example.com/products/1", {
        fetchImpl,
        lookup: safeLookup,
      }),
    ).rejects.toThrow(WebFetchError);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects public URL redirecting to private IP", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "http://192.168.0.10/internal" },
        }),
      );

    await expect(
      fetchProductPageHtml("https://shop.example.com/products/1", {
        fetchImpl,
        lookup: safeLookup,
      }),
    ).rejects.toThrow(/Private IP addresses are not allowed/);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("validates each hop in a redirect chain", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "https://hop2.example.com/step-2" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "https://hop3.example.com/step-3" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("<html><title>ok</title></html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );

    const result = await fetchProductPageHtml("https://hop1.example.com/step-1", {
      fetchImpl,
      lookup: safeLookup,
    });

    expect(result.finalUrl).toBe("https://hop3.example.com/step-3");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://hop1.example.com/step-1");
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("https://hop2.example.com/step-2");
    expect(fetchImpl.mock.calls[2]?.[0]).toBe("https://hop3.example.com/step-3");
  });

  it("rejects hostnames resolving to private addresses", async () => {
    const lookup = vi.fn(async () => [{ address: "127.0.0.1", family: 4 }]);
    const fetchImpl = vi.fn();

    await expect(
      fetchProductPageHtml("https://shop.example.com/products/1", {
        fetchImpl,
        lookup,
      }),
    ).rejects.toThrow(/Resolved address 127.0.0.1 is not allowed/);

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uses manual redirects instead of follow", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("<html><title>ok</title></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    await fetchProductPageHtml("https://shop.example.com/products/1", {
      fetchImpl,
      lookup: safeLookup,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://shop.example.com/products/1",
      expect.objectContaining({ redirect: "manual" }),
    );
  });
});
