import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
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

const CHIPS = ["ドラレコ", "ホイール", "車高調", "コーティング", "リセール"];

function AskPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [question, setQuestion] = useState(search.q ?? "");

  const maker = search.maker ?? "トヨタ";
  const model = search.model ?? "ヴォクシー";
  const year = search.year ?? "90系";

  const submit = () => {
    if (!question.trim()) return;
    navigate({ to: "/answer", search: { q: question, maker, model, year } as never });
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-2xl px-5 py-14 sm:py-24">
        {/* Vehicle breadcrumb */}
        <Link
          to="/"
          className="animate-fade-in group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-foreground/80">{maker}</span>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-foreground/80">{model}</span>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-foreground/80">{year}</span>
        </Link>

        <h1 className="animate-fade-in mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          何を知りたいですか？
        </h1>

        {/* Search input */}
        <div className="animate-fade-in mt-8 rounded-2xl border border-border bg-card/40 p-2 backdrop-blur transition-all focus-within:border-primary/60 focus-within:glow-blue">
          <div className="flex items-start gap-3 px-3 pt-3">
            <Search className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder="20万円以内でおすすめのホイールは？"
              rows={4}
              className="w-full resize-none bg-transparent text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <div className="mt-2 flex items-center justify-between px-3 pb-2">
            <span className="text-xs text-muted-foreground">{question.length} 文字</span>
            <button
              onClick={submit}
              disabled={!question.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search className="h-4 w-4" />
              検索する
            </button>
          </div>
        </div>

        {/* Chips */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            人気のカテゴリー
          </p>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c, i) => (
              <button
                key={c}
                onClick={() => setQuestion(`90系ヴォクシーにおすすめの${c}は？`)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-fade-in rounded-full border border-border bg-card/40 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover-scale"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
