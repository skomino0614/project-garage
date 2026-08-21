import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductImportAuthError } from "./product-import-auth";

vi.mock("./product-import-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./product-import-auth")>();
  return {
    ...actual,
    assertProductImportAdmin: vi.fn(),
  };
});

vi.mock("./register-candidate", () => ({
  createProductImportCandidateFromUrl: vi.fn(),
  registerProductCandidate: vi.fn(),
}));

vi.mock("@/lib/server/db/client.server", () => ({
  getDb: vi.fn(),
}));

import { assertProductImportAdmin } from "./product-import-auth";
import {
  handleFetchProductImportCandidate,
  handleRegisterProductImportCandidate,
} from "./product-import-candidate.handlers";
import {
  createProductImportCandidateFromUrl,
  registerProductCandidate,
} from "./register-candidate";

const registerInput = {
  sourceUrl: "https://shop.example.com/products/1",
  fetchedAt: new Date().toISOString(),
  name: "Demo Wheel",
  brand: "RAYS",
  description: "desc",
  priceMinYen: 100000,
  priceMaxYen: 120000,
  imageUrl: null,
  productUrl: "https://shop.example.com/products/1",
  purchaseUrl: null,
  category: "ホイール" as const,
  appearance: "unknown" as const,
  comfort: "unknown" as const,
  practicality: "unknown" as const,
  resale: "unknown" as const,
  style: "その他" as const,
  tags: [],
};

describe("product import candidate handlers", () => {
  beforeEach(() => {
    vi.mocked(assertProductImportAdmin).mockReset();
    vi.mocked(createProductImportCandidateFromUrl).mockReset();
    vi.mocked(registerProductCandidate).mockReset();
  });

  it("rejects unauthenticated fetch requests", async () => {
    vi.mocked(assertProductImportAdmin).mockRejectedValue(
      new ProductImportAuthError("Authentication required", 401),
    );

    await expect(
      handleFetchProductImportCandidate({ url: "https://shop.example.com/products/1" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(createProductImportCandidateFromUrl).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated register requests", async () => {
    vi.mocked(assertProductImportAdmin).mockRejectedValue(
      new ProductImportAuthError("Authentication required", 401),
    );

    await expect(handleRegisterProductImportCandidate(registerInput)).rejects.toMatchObject({
      status: 401,
    });

    expect(registerProductCandidate).not.toHaveBeenCalled();
  });

  it("rejects unauthorized users", async () => {
    vi.mocked(assertProductImportAdmin).mockRejectedValue(
      new ProductImportAuthError("Product import admin access required", 403),
    );

    await expect(
      handleFetchProductImportCandidate({ url: "https://shop.example.com/products/1" }),
    ).rejects.toMatchObject({ status: 403 });

    await expect(handleRegisterProductImportCandidate(registerInput)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("allows authorized fetch requests", async () => {
    vi.mocked(assertProductImportAdmin).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    vi.mocked(createProductImportCandidateFromUrl).mockResolvedValue({
      sourceUrl: "https://shop.example.com/products/1",
      fetchedAt: new Date().toISOString(),
      extractionSource: "html",
      warnings: [],
    });

    await handleFetchProductImportCandidate({ url: "https://shop.example.com/products/1" });

    expect(assertProductImportAdmin).toHaveBeenCalledTimes(1);
    expect(createProductImportCandidateFromUrl).toHaveBeenCalledWith(
      "https://shop.example.com/products/1",
      { useAi: true },
    );
  });
});
