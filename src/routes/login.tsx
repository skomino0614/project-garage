import { createFileRoute, getRouteApi, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";

import { GarageNav } from "@/components/GarageNav";
import { signInWithGoogle } from "@/lib/auth.functions";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "ログイン — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { user } = rootRoute.useRouteContext();
  const navigate = useNavigate();
  const startGoogleSignIn = useServerFn(signInWithGoogle);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await startGoogleSignIn();

      if ("error" in result) {
        setErrorMsg(result.error);
        setIsLoading(false);
        return;
      }

      window.location.href = result.url;
    } catch (err) {
      console.error(err);
      setErrorMsg("Googleログインの開始に失敗しました。");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col items-center justify-center px-5 py-16">
        <div className="animate-fade-in w-full text-center">
          <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Project Garage</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Googleアカウントでログインしてください
          </p>
        </div>

        <div className="animate-fade-in mt-10 w-full rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="glow-blue inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogIn className="h-4 w-4" />
            {isLoading ? "リダイレクト中..." : "Googleでログイン"}
          </button>
        </div>
      </main>
    </div>
  );
}
