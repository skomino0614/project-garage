import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowRight, Zap, TrendingUp, ArrowLeftRight, MessageSquare } from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import { MAKERS, MODELS } from "@/lib/car-data";

export const Route = createFileRoute("/")({
  component: Home,
});

const HOME_SERIES = ["90 Series", "80 Series", "70 Series", "2024", "2023", "2022", "2021", "2020"];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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

  const models = maker ? MODELS[maker] ?? [] : [];

  const inputCls =
    "w-full appearance-none rounded-xl border border-border bg-input px-3 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30";

  const goToAsk = () => {
    navigate({ to: "/ask", search: { maker, model, year: series } as never });
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] overflow-hidden">
        <div className="absolute left-1/2 top-[-160px] h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-3xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <section className="text-center">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Zap className="h-3 w-3 text-primary" />
            3時間の検索を3分に
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            <span className="text-gradient">3時間の検索</span>
            <br />
            <span className="text-foreground">を3分で</span>
          </h1>

          <p className="animate-fade-in mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            調べる時間を、決定する時間に変える。
          </p>

          {/* Vehicle selector */}
          <div className="animate-fade-in mt-8">
            <div className="mx-auto max-w-xl rounded-2xl border border-border/80 bg-card/50 p-4 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="メーカー">
                  <select
                    className={inputCls}
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
                    className={inputCls}
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
                  <select className={inputCls} value={series} onChange={(e) => setSeries(e.target.value)}>
                    {HOME_SERIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              onClick={goToAsk}
              className="glow-blue group mt-4 inline-flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 sm:w-auto"
            >
              この車で相談する
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="animate-fade-in mt-12 grid gap-3 sm:grid-cols-3">
            {[
              { icon: TrendingUp, label: "人気ランキング" },
              { icon: ArrowLeftRight, label: "比較する" },
              { icon: MessageSquare, label: "AI相談" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={goToAsk}
                className="group flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/40 px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground"
              >
                <item.icon className="h-4 w-4 text-primary transition-colors" />
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
