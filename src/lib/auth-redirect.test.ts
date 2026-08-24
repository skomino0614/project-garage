import { describe, expect, it } from "vitest";

import {
  buildAuthCallbackUrl,
  isAllowedAuthOrigin,
  PRODUCTION_APP_ORIGIN,
  resolveAuthRedirectOrigin,
} from "./auth-redirect";

describe("auth redirect origins", () => {
  it("allows localhost origins", () => {
    expect(isAllowedAuthOrigin("http://localhost:5173")).toBe(true);
    expect(isAllowedAuthOrigin("http://127.0.0.1:3000")).toBe(true);
  });

  it("allows production and Vercel preview origins", () => {
    expect(isAllowedAuthOrigin(PRODUCTION_APP_ORIGIN)).toBe(true);
    expect(isAllowedAuthOrigin("https://project-garage-git-main-user.vercel.app")).toBe(true);
  });

  it("rejects unknown origins", () => {
    expect(isAllowedAuthOrigin("https://evil.example.com")).toBe(false);
    expect(isAllowedAuthOrigin("javascript:alert(1)")).toBe(false);
  });

  it("prefers validated client origin over server origin", () => {
    expect(
      resolveAuthRedirectOrigin(
        "https://project-garage-git-feature-user.vercel.app",
        PRODUCTION_APP_ORIGIN,
      ),
    ).toBe("https://project-garage-git-feature-user.vercel.app");
  });

  it("falls back to server origin when client origin is missing", () => {
    expect(resolveAuthRedirectOrigin(undefined, PRODUCTION_APP_ORIGIN)).toBe(
      PRODUCTION_APP_ORIGIN,
    );
  });

  it("returns null when neither origin is allowed", () => {
    expect(
      resolveAuthRedirectOrigin("https://evil.example.com", "https://also-evil.example.com"),
    ).toBeNull();
  });

  it("builds auth callback URLs", () => {
    expect(buildAuthCallbackUrl("https://project-garage-git-main-user.vercel.app/")).toBe(
      "https://project-garage-git-main-user.vercel.app/auth/callback",
    );
  });
});
