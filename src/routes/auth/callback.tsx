import { createFileRoute, redirect } from "@tanstack/react-router";

import { exchangeAuthCode } from "@/lib/auth.functions";

type Search = { code?: string; next?: string };

function sanitizeNext(next: string | undefined): "/" | string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    code: typeof search.code === "string" ? search.code : undefined,
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (!search.code) {
      throw redirect({ to: "/login" });
    }

    const result = await exchangeAuthCode({ data: { code: search.code } });

    if (!result.user) {
      throw redirect({ to: "/login" });
    }

    throw redirect({ to: sanitizeNext(search.next) as "/" });
  },
  component: CallbackPage,
});

function CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">ログイン処理中...</p>
    </div>
  );
}
