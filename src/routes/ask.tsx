import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { GarageNav } from "../components/GarageNav";

type Search = { maker?: string; model?: string; year?: string; q?: string };

export const Route = createFileRoute("/ask")({
  head: () => ({ meta: [{ title: "質問する — Project Garage" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    maker: typeof s.maker === "string" ? s.maker : undefined,
    model: typeof s.model === "string" ? s.model : undefined,
    year: typeof s.year === "string" ? s.year : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: AskPage,
});

const SUGGESTIONS = [
  "20万円以内でおすすめのホイールを教えて",
  "サーキット走行向けのブレーキパッドは？",
  "ドレスアップに人気のエアロは？",
  "静音化のためのマフラー交換について",
];

function AskPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!question.trim()) return;
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/answer", search: { q: question, ...search } as never });
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        {(search.maker || search.model) && (
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {[search.maker, search.model, search.year].filter(Boolean).join(" · ")}
          </div>
        )}

        <h1 className="animate-fade-in text-3xl font-bold tracking-tight sm:text-4xl">
          何について知りたいですか？
        </h1>
        <p className="animate-fade-in mt-2 text-sm text-muted-foreground">
          具体的な予算や用途を入れると、より精度の高い提案が受けられます。
        </p>

        <div className="animate-fade-in mt-8 rounded-2xl border border-border bg-card/40 p-2 backdrop-blur transition-all focus-within:border-primary/60 focus-within:glow-blue">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="20万円以内でおすすめのホイールを教えて"
            rows={6}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <span className="text-xs text-muted-foreground">{question.length} 文字</span>
            <button
              onClick={submit}
              disabled={!question.trim() || loading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AIに聞く
            </button>
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">サンプル質問</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => setQuestion(s)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-fade-in rounded-full border border-border bg-card/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
