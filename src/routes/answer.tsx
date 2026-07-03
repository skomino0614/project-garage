import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Youtube, MessageCircle, FileText, ExternalLink, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { GarageNav } from "../components/GarageNav";

type Search = { q?: string; maker?: string; model?: string; year?: string };

export const Route = createFileRoute("/answer")({
  head: () => ({ meta: [{ title: "回答 — Project Garage" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    maker: typeof s.maker === "string" ? s.maker : undefined,
    model: typeof s.model === "string" ? s.model : undefined,
    year: typeof s.year === "string" ? s.year : undefined,
  }),
  component: AnswerPage,
});

const PRODUCTS = [
  { name: "ENKEI PF07", price: "¥168,000 / 4本", tag: "軽量鍛造", desc: "軽量かつ剛性が高く、ストリート〜サーキットまで対応。" },
  { name: "WORK EMOTION T7R", price: "¥152,000 / 4本", tag: "定番人気", desc: "スポーティなデザインで幅広い車種にマッチ。" },
  { name: "RAYS Volk TE37", price: "¥192,000 / 4本", tag: "アイコン", desc: "軽量鍛造の代名詞。所有欲を満たす一本。" },
];

const REASONS = [
  "予算20万円以内で高品質な鍛造ホイールを選定",
  "重量バランスと剛性の観点から走行性能を優先",
  "国内で流通量が多く、メンテナンス性も良好",
];

const REFS = {
  youtube: [
    { title: "20万円で買える軽量ホイール比較【2024年版】", channel: "Garage Life JP" },
    { title: "PF07 vs TE37 実測レビュー", channel: "Motor Weekly" },
  ],
  forums: [
    { title: "みんカラ: PF07装着後のインプレまとめ", meta: "312 コメント" },
    { title: "86BRZ.com: 軽量ホイール選びの決定版", meta: "89 スレッド" },
  ],
  articles: [
    { title: "鍛造ホイールの選び方 徹底解説", source: "Web CARTOP" },
    { title: "ホイール重量と走りの関係", source: "MotorFan" },
  ],
};

function AnswerPage() {
  const { q, maker, model, year } = Route.useSearch();
  const [liked, setLiked] = useState(false);
  const carLabel = [maker, model, year].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <Link to="/ask" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          質問を編集
        </Link>

        {/* Question card */}
        <div className="animate-fade-in mb-6 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
          {carLabel && (
            <div className="mb-2 text-xs text-muted-foreground">{carLabel}</div>
          )}
          <p className="text-sm text-foreground/90">{q ?? "20万円以内でおすすめのホイールを教えて"}</p>
        </div>

        {/* Answer card */}
        <section className="animate-fade-in overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur glow-blue">
          <div className="flex items-center gap-2 border-b border-border/70 px-6 py-4">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">AIの回答</span>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <p className="text-base leading-relaxed text-foreground/90">
              予算20万円以内であれば、<span className="font-semibold text-foreground">軽量鍛造ホイール</span>から選ぶのがおすすめです。走行性能・見た目・リセールバリューのバランスが良い3モデルを厳選しました。
            </p>

            {/* Recommended products */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">おすすめ製品</h3>
              <div className="grid gap-3">
                {PRODUCTS.map((p, i) => (
                  <div
                    key={p.name}
                    style={{ animationDelay: `${i * 80}ms` }}
                    className="animate-fade-in group flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-background/40 p-4 transition-all hover:border-primary/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{p.name}</h4>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">{p.tag}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                    <div className="text-right text-sm font-semibold whitespace-nowrap">{p.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">選定理由</h3>
              <ul className="space-y-2.5">
                {REASONS.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Like */}
          <div className="flex items-center justify-between border-t border-border/70 bg-background/30 px-6 py-4">
            <span className="text-xs text-muted-foreground">この回答は役に立ちましたか？</span>
            <button
              onClick={() => setLiked((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all hover-scale ${
                liked
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 transition-all ${liked ? "fill-current" : ""}`} />
              {liked ? "いいね済み" : "いいね"}
            </button>
          </div>
        </section>

        {/* References */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">参考リソース</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <RefColumn icon={<Youtube className="h-4 w-4" />} title="YouTube" items={REFS.youtube.map(v => ({ title: v.title, sub: v.channel }))} />
            <RefColumn icon={<MessageCircle className="h-4 w-4" />} title="フォーラム" items={REFS.forums.map(v => ({ title: v.title, sub: v.meta }))} />
            <RefColumn icon={<FileText className="h-4 w-4" />} title="記事" items={REFS.articles.map(v => ({ title: v.title, sub: v.source }))} />
          </div>
        </section>
      </main>
    </div>
  );
}

function RefColumn({ icon, title, items }: { icon: React.ReactNode; title: string; items: { title: string; sub: string }[] }) {
  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">{icon}</span>
        {title}
      </div>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.title}>
            <a href="#" className="group block">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-snug text-foreground/90 transition-colors group-hover:text-primary">{it.title}</p>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{it.sub}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
