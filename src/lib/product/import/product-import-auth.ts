import type { AuthUser } from "@/lib/auth.functions";
import { fetchClaims } from "@/lib/auth.functions";

export class ProductImportAuthError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "ProductImportAuthError";
    this.status = status;
  }
}

function parseAdminEmails(raw: string | undefined): Set<string> {
  if (!raw?.trim()) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getProductImportAdminEmails(): Set<string> {
  return parseAdminEmails(process.env.PRODUCT_IMPORT_ADMIN_EMAILS);
}

export function isProductImportAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) {
    return false;
  }

  return getProductImportAdminEmails().has(email.trim().toLowerCase());
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  return fetchClaims();
}

export async function assertProductImportAdmin(): Promise<AuthUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new ProductImportAuthError("Authentication required", 401);
  }

  if (!isProductImportAdminEmail(user.email)) {
    throw new ProductImportAuthError("Product import admin access required", 403);
  }

  return user;
}
