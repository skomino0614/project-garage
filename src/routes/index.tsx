import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Youtube, MessageSquare, Wrench } from "lucide-react";
import { GarageNav } from "../components/GarageNav";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <GarageNav />

      {/* Ambient blue glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[600px] overflow-hidden">
        <div className="absolute left-1/2 top-[-200px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-Powered Car Customization
          </div>

          <h1 className="animate-fade-in mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            <span className="text-gradient">3時間の検索</span>
            <br />
            <span className="text-foreground">を3分で</span>
          </h1>

          <p className="animate-fade-in mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            AIが車の情報を整理して最適な答えを提案します。
            <br className="hidden sm:block" />
            YouTube、フォーラム、Googleを何時間も検索する必要はもうありません。
          </p>

          <div className="animate-fade-in mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/select"
              className="glow-blue group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90"
            >
              質問する
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/ask"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-card"
            >
              サンプルを見る
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {[
            { icon: Wrench, title: "パーツ選定", desc: "予算・車種に合わせて最適なパーツを提案" },
            { icon: MessageSquare, title: "フォーラム集約", desc: "みんカラ等の議論を要約して提示" },
            { icon: Youtube, title: "動画リファレンス", desc: "関連するレビュー動画を自動でリンク" },
          ].map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-in group rounded-2xl border border-border/70 bg-card/40 p-6 transition-all hover:border-primary/50 hover:bg-card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
