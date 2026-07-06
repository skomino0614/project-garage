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
  Camera,
  Sparkles,
} from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import heroImage from "@/assets/dashcam-hero.jpg";

type Search = { q?: string; maker?: string; model?: string; year?: string };

export const Route = createFileRoute("/answer")({
  head: () => ({ meta: [{ title: "AI回答 — Project Garage" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    maker: typeof s.maker === "string" ? s.maker : undefined,
    model: typeof s.model === "string" ? s.model : undefined,
    year: typeof s.year === "string" ? s.year : undefined,
  }),
  component: AnswerPage,
});

const PICK = {
  name: "70mai A810",
  rating: 4.9,
  reviews: 124,
  bestFor: "4K前後撮影とナンバー読み取りを重視する人",
  price: "¥35,000 前後",
};

const REASONS = [
  "90系ヴォクシーのワイドなフロントガラスに前後2カメラが設置しやすい",
  "夜間のノイズ抑制とナンバー読み取り性能が高い",
  "駐車監視オプションで普段使いもカバーできる",
];

const CAUTIONS = [
  "前後カメラの配線は専門店での取り付けを推奨",
  "microSDの容量・耐久性を確認（高耐久品を選ぶ）",
  "常時電源が必要な駐車監視はバッテリーへの影響を把握",
];

const ALTERNATIVES = [
  {
    name: "Yupiteru DRY-WiFiV3c",
    rating: 4.5,
    price: "¥45,000 前後",
    bestFor: "Wi-Fi転送でスマホ確認が便利",
  },
  {
    name: "KENWOOD DRV-MN940",
    rating: 4.7,
    price: "¥55,000 前後",
    bestFor: "高画質と完成度の高い駐車監視",
  },
  {
    name: "Pioneer VREC-DH300D",
    rating: 4.3,
    price: "¥28,000 前後",
    bestFor: "コスパ重視でシンプルな1カメラ",
  },
];

const REFS = {
  youtube: [
    { title: "2024年 ドラレコおすすめ10選", sub: "Car Gear チャンネル" },
    { title: "90系ヴォクシーに取り付けレビュー", sub: "Voxy Style" },
  ],
  minkara: [
    { title: "A810の実装レポート", sub: "156 いいね" },
    { title: "ドラレコ取り付け工賃まとめ", sub: "42 スレッド" },
  ],
  official: [
    { title: "70mai A810 製品ページ", sub: "70mai Japan" },
    { title: "駐車監視オプション一覧", sub: "70mai Japan" },
  ],
};

const SHOPS = [{ name: "Amazon" }, { name: "楽天市場" }, { name: "Yahoo!ショッピング" }];

function AnswerPage() {
  const { q, maker, model, year } = Route.useSearch();
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const car = {
    maker: maker ?? "トヨタ",
    model: model ?? "ヴォクシー",
    year: year ?? "90系",
  };
  const question = q ?? "90系ヴォクシーにおすすめのドラレコは？";

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <Link
          to="/ask"
          search={{ q, maker, model, year } as never}
          className="animate-fade-in mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          質問を編集
        </Link>

        {/* Header */}
        <div className="animate-fade-in mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            AI回答
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-foreground/80">{car.maker}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground/80">{car.model}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground/80">{car.year}</span>
          </div>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {question}
          </h1>
        </div>

        {/* 1. 結論 */}
        <section className="animate-fade-in mb-6" style={{ animationDelay: "70ms" }}>
          <div className="overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur transition-all hover:border-primary/40">
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img
                src={heroImage}
                alt="おすすめドラレコ"
                width={1024}
                height={768}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  最適な答え
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-medium text-secondary-foreground">
                  {car.year} {car.model}対応
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {PICK.name}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <Rating value={PICK.rating} />
                <span className="text-sm font-semibold text-foreground/90">{PICK.rating}</span>
                <span className="text-xs text-muted-foreground">
                  （{PICK.reviews}件のレビュー）
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                <span className="text-foreground/80">おすすめの人: </span>
                {PICK.bestFor}
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">{PICK.price}</p>
            </div>
          </div>
        </section>

        {/* 2. おすすめ理由 */}
        <SectionCard title="おすすめ理由" icon={<CheckCircle2 className="h-4 w-4" />} delay="140ms">
          <ul className="space-y-3">
            {REASONS.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* 3. 注意点 */}
        <section
          className="animate-fade-in mb-6 overflow-hidden rounded-2xl border border-warning/20 bg-warning/5 backdrop-blur"
          style={{ animationDelay: "210ms" }}
        >
          <header className="flex items-center gap-3 border-b border-warning/20 px-6 py-4">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-warning/15 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight">注意点</h2>
          </header>
          <ul className="space-y-3 p-6">
            {CAUTIONS.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. 他の候補 */}
        <SectionCard title="他の候補" icon={<Sparkles className="h-4 w-4" />} delay="280ms">
          <div className="grid gap-3 sm:grid-cols-3">
            {ALTERNATIVES.map((alt, i) => (
              <AlternativeCard key={alt.name} product={alt} delay={`${i * 60}ms`} />
            ))}
          </div>
        </SectionCard>

        {/* 5. 参考情報 */}
        <SectionCard title="参考情報" icon={<Youtube className="h-4 w-4" />} delay="350ms">
          <div className="grid gap-3 sm:grid-cols-3">
            <RefColumn
              title="YouTube"
              icon={<Youtube className="h-4 w-4" />}
              items={REFS.youtube}
            />
            <RefColumn
              title="みんカラ"
              icon={<MessageCircle className="h-4 w-4" />}
              items={REFS.minkara}
            />
            <RefColumn
              title="メーカー公式"
              icon={<Building2 className="h-4 w-4" />}
              items={REFS.official}
            />
          </div>
        </SectionCard>

        {/* 6. 購入する */}
        <SectionCard title="購入する" icon={<ShoppingBag className="h-4 w-4" />} delay="420ms">
          <div className="grid gap-3 sm:grid-cols-3">
            {SHOPS.map((s) => (
              <a
                key={s.name}
                href="#"
                className="group flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3 transition-all hover:border-primary/60 hover:bg-card/60 hover-scale"
              >
                <span className="text-sm font-semibold">{s.name}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </a>
            ))}
          </div>
        </SectionCard>

        {/* 7. Feedback */}
        <div
          className="animate-fade-in rounded-2xl border border-border bg-card/40 p-6 backdrop-blur"
          style={{ animationDelay: "490ms" }}
        >
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
      </main>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  delay = "0ms",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <section
      className="animate-fade-in mb-6 overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur"
      style={{ animationDelay: delay }}
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function AlternativeCard({
  product,
  delay,
}: {
  product: (typeof ALTERNATIVES)[number];
  delay: string;
}) {
  return (
    <div
      className="animate-fade-in group rounded-xl border border-border/70 bg-background/40 p-4 transition-all hover:border-primary/60"
      style={{ animationDelay: delay }}
    >
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted/50">
        <Camera className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{product.name}</h3>
      <div className="mt-1 flex items-center gap-1.5">
        <Rating value={product.rating} />
        <span className="text-xs font-medium text-foreground/80">{product.rating}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{product.bestFor}</p>
      <p className="mt-1 text-sm font-semibold">{product.price}</p>
    </div>
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
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
