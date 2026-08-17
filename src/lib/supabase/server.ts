import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";

function getSupabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  }

  return { url, key };
}

export function createClient() {
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          setResponseHeader(name, value);
        });
      },
    },
  });
}
