import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowRight, Zap, Search } from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import { MAKERS, MODELS } from "@/lib/car-data";

export const Route = createFileRoute("/")({
  component: Home,
});

const HOME_SERIES = ["90 Series", "80 Series", "70 Series", "2024", "2023", "2022", "2021", "2020"];

const CHIPS = ["ドラレコ", "ホイール", "タイヤ", "車高調", "コーティング", "リセール"];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Home() {
  const navigate = useNavigate();
  const [maker, setMaker] = useState("Toyota");
  const [model, setModel] = useState("Voxy");
  const [series, setSeries] = useState("90 Series");
  const [query, setQuery] = useState("");

  const models = maker ? MODELS[maker] ?? [] : [];

  const selectCls =
    "w-full appearance-none rounded-xl border border-border bg-input px-2.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30";

  const submit = () => {
    const q = query.trim();
    navigate({ to: "/ask", search: { maker, model, year: series, q: q || undefined } as never });
  };

  const fillChip = (chip: string) => {
    setQuery(`90系ヴォクシーにおすすめの${chip}は？`);
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[520px] overflow-hidden">
        <div className="absolute left-1/2 top-[-160px] h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col items-center justify-center px-5 py-16 sm:py-24">
        <section className="w-full text-center">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Zap className="h-3 w-3 text-primary" />
            3時間の検索を3分に
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            <span className="text-gradient">車のカスタム</span>
            <br />
            <span className="text-foreground">決めるだけ</span>
          </h1>

          <p className="animate-fade-in mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            何でも聞いてください。最適な答えがすぐ見つかります。
          </p>

          {/* Vehicle selector */}
          <div className="animate-fade-in mx-auto mt-8 max-w-lg">
            <div className="rounded-2xl border border-border/80 bg-card/50 p-3 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="メーカー">
                  <select
                    className={selectCls}
                    value={maker}
                    onChange={(e) => {
                      const next = e.target.value;
                      setMaker(next);
                      setModel(MODELS[next]?.[0] ?? "");
                    }}
                  >
                    {MAKERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="車種">
                  <select
                    className={selectCls}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!maker}
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="シリーズ">
                  <select className={selectCls} value={series} onChange={(e) => setSeries(e.target.value)}>
                    {HOME_SERIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* Search box */}
          <div className="animate-fade-in mx-auto mt-4 w-full max-w-2xl">
            <div className="group relative rounded-3xl border border-border/80 bg-card/60 backdrop-blur transition-all focus-within:border-primary/60 focus-within:glow-blue">
              <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
                <Search className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="あなたの車について何でも相談してください"
                className="h-16 w-full rounded-3xl bg-transparent pl-14 pr-14 text-base text-foreground placeholder:text-muted-foreground/60 outline-none sm:h-18 sm:text-lg"
              />
              <button
                onClick={submit}
                className="absolute inset-y-0 right-2 my-2 inline-flex aspect-square items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
                aria-label="相談する"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="animate-fade-in mx-auto mt-3 w-full max-w-2xl text-center">
            <p className="text-xs leading-relaxed text-muted-foreground/60">
              例）
              <br />
              ・20万円以内でおすすめホイールは？
              <br />
              ・90系ヴォクシーにおすすめのドラレコは？
              <br />
              ・乗り心地を落とさずローダウンしたい
            </p>
          </div>

          {/* Chips */}
          <div className="animate-fade-in mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => fillChip(chip)}
                className="rounded-full border border-border/70 bg-card/40 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover:bg-card/60"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={submit}
            className="animate-fade-in glow-blue group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            この車で相談する
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </section>
      </main>
    </div>
  );
}

