import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getProductImportAdminEmails,
  isProductImportAdminEmail,
  ProductImportAuthError,
  assertProductImportAdmin,
} from "./product-import-auth";

vi.mock("@/lib/auth.functions", () => ({
  fetchClaims: vi.fn(),
}));

import { fetchClaims } from "@/lib/auth.functions";

const originalEnv = process.env.PRODUCT_IMPORT_ADMIN_EMAILS;

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.PRODUCT_IMPORT_ADMIN_EMAILS;
  } else {
    process.env.PRODUCT_IMPORT_ADMIN_EMAILS = originalEnv;
  }
  vi.mocked(fetchClaims).mockReset();
});

describe("product import admin auth", () => {
  it("parses admin emails from env", () => {
    process.env.PRODUCT_IMPORT_ADMIN_EMAILS = "Admin@Example.com, user@example.com";
    expect(getProductImportAdminEmails()).toEqual(
      new Set(["admin@example.com", "user@example.com"]),
    );
    expect(isProductImportAdminEmail("admin@example.com")).toBe(true);
    expect(isProductImportAdminEmail("other@example.com")).toBe(false);
  });

  it("rejects unauthenticated users", async () => {
    process.env.PRODUCT_IMPORT_ADMIN_EMAILS = "admin@example.com";
    vi.mocked(fetchClaims).mockResolvedValue(null);

    await expect(assertProductImportAdmin()).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("rejects authenticated users without admin email", async () => {
    process.env.PRODUCT_IMPORT_ADMIN_EMAILS = "admin@example.com";
    vi.mocked(fetchClaims).mockResolvedValue({
      id: "user-1",
      email: "other@example.com",
    });

    await expect(assertProductImportAdmin()).rejects.toMatchObject({
      status: 403,
      message: "Product import admin access required",
    });
  });

  it("allows configured admin users", async () => {
    process.env.PRODUCT_IMPORT_ADMIN_EMAILS = "admin@example.com";
    vi.mocked(fetchClaims).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });

    await expect(assertProductImportAdmin()).resolves.toEqual({
      id: "admin-1",
      email: "admin@example.com",
    });
  });

  it("exposes auth error status codes", () => {
    expect(new ProductImportAuthError("Authentication required", 401).status).toBe(401);
    expect(new ProductImportAuthError("Product import admin access required", 403).status).toBe(
      403,
    );
  });
});
