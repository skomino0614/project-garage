import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ChevronRight, Check } from "lucide-react";
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

const CHECKLIST = [
  "YouTubeを分析中",
  "オーナーレビューを確認中",
  "メーカー情報を整理中",
  "最適な提案を作成中",
];

function AskPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [question, setQuestion] = useState(search.q ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  const maker = search.maker ?? "トヨタ";
  const model = search.model ?? "ヴォクシー";
  const year = search.year ?? "90系";

  useEffect(() => {
    if (!isLoading) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    CHECKLIST.forEach((_, i) => {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.max(prev, i + 1));
      }, (i + 1) * 800);
      timers.push(timer);
    });

    const navigateTimer = setTimeout(() => {
      navigate({ to: "/answer", search: { q: question, maker, model, year } as never });
    }, 4500);
    timers.push(navigateTimer);

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isLoading, question, maker, model, year, navigate]);

  const submit = () => {
    if (!question.trim()) return;
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GarageNav />
        <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-5">
          <div className="animate-fade-in w-full max-w-md text-center">
            <div className="relative mx-auto mb-8 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              AIが情報を整理しています...
            </h1>
            <div className="mt-8 space-y-3 text-left">
              {CHECKLIST.map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-4 py-3 backdrop-blur transition-all duration-500 ${
                    i < visibleCount
                      ? "translate-x-0 opacity-100"
                      : "translate-x-3 opacity-0"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full border transition-colors duration-300 ${
                      i < visibleCount
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-transparent text-muted-foreground"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-foreground/90">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

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
