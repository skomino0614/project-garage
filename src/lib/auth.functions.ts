import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

import { createClient } from "./supabase/server";

export type AuthUser = {
  id: string;
  email: string;
};

function toAuthUser(claims: Record<string, unknown>): AuthUser | null {
  const id = typeof claims.sub === "string" ? claims.sub : null;
  if (!id) return null;

  return {
    id,
    email: typeof claims.email === "string" ? claims.email : "",
  };
}

export const fetchClaims = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    return toAuthUser(data.claims as Record<string, unknown>);
  },
);

export const signInWithGoogle = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ url: string } | { error: string }> => {
    const supabase = createClient();
    const origin = getRequestUrl().origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error || !data.url) {
      return { error: error?.message ?? "Failed to start Google OAuth" };
    }

    return { url: data.url };
  },
);

export const signOut = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: true }> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return { success: true };
  },
);

export const exchangeAuthCode = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid request body");
    }

    const code = (data as { code?: unknown }).code;
    if (typeof code !== "string" || !code) {
      throw new Error("Missing OAuth code");
    }

    return { code };
  })
  .handler(async ({ data }): Promise<{ user: AuthUser | null }> => {
    const supabase = createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(data.code);

    if (error || !sessionData.user) {
      return { user: null };
    }

    return {
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email ?? "",
      },
    };
  });
