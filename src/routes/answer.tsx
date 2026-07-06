import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Youtube,
  MessageCircle,
  Building2,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
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
  {
    name: "ENKEI PF07",
    rating: 4.8,
    bestFor: "軽さと剛性の両立を求める人",
    price: "¥168,000 / 4本",
    tag: "編集部イチオシ",
  },
  {
    name: "WORK EMOTION T7R",
    rating: 4.6,
    bestFor: "ストリートでのドレスアップ重視",
    price: "¥152,000 / 4本",
    tag: "コスパ",
  },
  {
    name: "RAYS Volk TE37",
    rating: 4.9,
    bestFor: "所有欲とリセールを両立したい人",
    price: "¥192,000 / 4本",
    tag: "アイコン",
  },
];

const REASONS = [
  "20万円以内で購入できる軽量鍛造ホイールを厳選",
  "重量バランスと剛性の観点で走行性能を優先",
  "国内で流通量が多く、装着例と情報が豊富",
];

const CAUTIONS = [
  "サイズ・PCD・オフセットが車種と合っているか必ず確認",
  "純正比で外径が変わる場合、車検・スピードメーター誤差に注意",
  "冬タイヤ用ホイールとは別に予算計画を",
];

const REFS = {
  youtube: [
    { title: "20万円で買える軽量ホイール比較【2024年版】", sub: "Garage Life JP" },
    { title: "PF07 vs TE37 実測レビュー", sub: "Motor Weekly" },
  ],
  minkara: [
    { title: "PF07装着後のインプレまとめ", sub: "312 コメント" },
    { title: "軽量ホイール選びの決定版", sub: "89 スレッド" },
  ],
  official: [
    { title: "ENKEI 公式カタログ PF07", sub: "enkei.co.jp" },
    { title: "RAYS 適合検索 TE37", sub: "rayswheels.co.jp" },
  ],
};

const SHOPS = [
  { name: "Amazon", tag: "最速配送", accent: "from-orange-500/20 to-yellow-500/10" },
  { name: "楽天市場", tag: "ポイント還元", accent: "from-red-500/20 to-pink-500/10" },
  { name: "Yahoo!ショッピング", tag: "PayPay対応", accent: "from-purple-500/20 to-fuchsia-500/10" },
];

function AnswerPage() {
  const { q, maker, model, year } = Route.useSearch();
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const car = {
    maker: maker ?? "トヨタ",
    model: model ?? "ヴォクシー",
    year: year ?? "90系",
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <Link
          to="/ask"
          search={{ q, maker, model, year } as never}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          質問を編集
        </Link>

        {/* Question header */}
        <div className="animate-fade-in mb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-foreground/80">{car.maker}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground/80">{car.model}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground/80">{car.year}</span>
          </div>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {q ?? "20万円以内でおすすめのホイールは？"}
          </h1>
        </div>

        <div className="space-y-6">
          {/* 1. おすすめ商品 */}
          <SectionCard index="01" title="おすすめ商品" icon={<Sparkles className="h-4 w-4" />}>
            <div className="grid gap-3">
              {PRODUCTS.map((p, i) => (
                <div
                  key={p.name}
                  style={{ animationDelay: `${i * 70}ms` }}
                  className="animate-fade-in group rounded-xl border border-border/70 bg-background/40 p-5 transition-all hover:border-primary/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{p.name}</h3>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                          {p.tag}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Rating value={p.rating} />
                        <span className="text-xs font-medium text-foreground/80">{p.rating}</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        <span className="text-foreground/60">おすすめの人: </span>
                        {p.bestFor}
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold whitespace-nowrap">{p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 2. おすすめ理由 */}
          <SectionCard index="02" title="おすすめ理由" icon={<CheckCircle2 className="h-4 w-4" />}>
            <ul className="space-y-3">
              {REASONS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* 3. 注意点 */}
          <SectionCard index="03" title="注意点" icon={<AlertTriangle className="h-4 w-4" />}>
            <ul className="space-y-3">
              {CAUTIONS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                  {r}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* 4. 参考情報 */}
          <SectionCard index="04" title="参考情報" icon={<Youtube className="h-4 w-4" />}>
            <div className="grid gap-4 sm:grid-cols-3">
              <RefColumn icon={<Youtube className="h-4 w-4" />} title="YouTube" items={REFS.youtube} />
              <RefColumn icon={<MessageCircle className="h-4 w-4" />} title="みんカラ" items={REFS.minkara} />
              <RefColumn icon={<Building2 className="h-4 w-4" />} title="メーカー公式" items={REFS.official} />
            </div>
          </SectionCard>

          {/* 5. 購入先 */}
          <SectionCard index="05" title="購入先" icon={<ShoppingBag className="h-4 w-4" />}>
            <div className="grid gap-3 sm:grid-cols-3">
              {SHOPS.map((s) => (
                <a
                  key={s.name}
                  href="#"
                  className={`group relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br ${s.accent} p-4 transition-all hover:border-primary/60 hover-scale`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.tag}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </a>
              ))}
            </div>
          </SectionCard>

          {/* 6. Feedback */}
          <div className="animate-fade-in rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">この回答は役に立ちましたか？</p>
              <div className="flex gap-3">
                <FeedbackButton
                  active={feedback === "up"}
                  onClick={() => setFeedback("up")}
                  icon={<ThumbsUp className="h-4 w-4" />}
                  label="役に立った"
                />
                <FeedbackButton
                  active={feedback === "down"}
                  onClick={() => setFeedback("down")}
                  icon={<ThumbsDown className="h-4 w-4" />}
                  label="改善してほしい"
                />
              </div>
              {feedback && (
                <p className="animate-fade-in text-xs text-muted-foreground">
                  フィードバックありがとうございます。
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionCard({
  index,
  title,
  icon,
  children,
}: {
  index: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-in overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur">
      <header className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          {index}
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function RefColumn({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { title: string; sub: string }[];
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.title}>
            <a href="#" className="group block">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-snug text-foreground/90 transition-colors group-hover:text-primary">
                  {it.title}
                </p>
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

function FeedbackButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all hover-scale ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
