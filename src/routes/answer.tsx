import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Star,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Camera,
  ListChecks,
} from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import heroImage from "@/assets/dashcam-hero.jpg";

type Search = { q?: string; maker?: string; model?: string; year?: string };

export const Route = createFileRoute("/answer")({
  head: () => ({ meta: [{ title: "あなたへの提案 — Project Garage" }] }),
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
  price: "¥35,000 前後",
};

const REASONS = [
  "90系ヴォクシーのワイドなフロントガラスに前後2カメラが設置しやすい",
  "夜間のノイズ抑制とナンバー読み取り性能が高い",
  "駐車監視オプションで普段使いもカバーできる",
];

const RECOMMENDED_FOR = [
  "4K前後撮影とナンバー読み取りを重視する人",
  "スマホで簡単に映像を確認したい人",
  "駐車監視であおり運転や当て逃げを防ぎたい人",
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

function AnswerPage() {
  const { q, maker, model, year } = Route.useSearch();

  const car = {
    maker: maker ?? "トヨタ",
    model: model ?? "ヴォクシー",
    year: year ?? "90系",
  };
  const question = q ?? "90系ヴォクシーにおすすめのドラレコは？";

  const conditions = [
    { label: "車種", value: `${car.year} ${car.model}` },
    { label: "予算", value: "4万円以内" },
    { label: "重視", value: "夜間画質" },
    { label: "用途", value: "家族利用" },
  ];

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
        <div className="animate-fade-in mb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            あなたへの提案
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

        {/* 1. 商品カード */}
        <section className="animate-fade-in mb-6" style={{ animationDelay: "70ms" }}>
          <div className="overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur transition-all hover:border-primary/40">
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img
                src={heroImage}
                alt={PICK.name}
                width={1024}
                height={768}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" />
                この条件ならこれがベストです。
              </p>
              <div className="mb-4 flex items-center gap-2">
                <Rating value={PICK.rating} />
                <span className="text-xs font-medium text-foreground/80">{PICK.rating}</span>
                <span className="text-xs text-muted-foreground">（{PICK.reviews}件）</span>
                <span className="ml-auto rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  おすすめ
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {PICK.name}
              </h2>
              <p className="mt-3 text-lg font-semibold text-foreground">{PICK.price}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {car.year} {car.model}対応
              </p>
            </div>
          </div>
        </section>

        {/* 2. あなたの条件 */}
        <SectionCard
          title="あなたの条件"
          icon={<ListChecks className="h-4 w-4" />}
          delay="140ms"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {conditions.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground/90">{c.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 3. あなたにおすすめする理由 */}
        <SectionCard
          title="あなたにおすすめする理由"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delay="210ms"
        >
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

        {/* 4. こんな人におすすめ */}
        <SectionCard
          title="こんな人におすすめ"
          icon={<Sparkles className="h-4 w-4" />}
          delay="280ms"
        >
          <ul className="space-y-3">
            {RECOMMENDED_FOR.map((r) => (
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

        {/* 5. 購入前の注意点 */}
        <section
          className="animate-fade-in mb-6 overflow-hidden rounded-2xl border border-warning/20 bg-warning/5 backdrop-blur"
          style={{ animationDelay: "350ms" }}
        >
          <header className="flex items-center gap-3 border-b border-warning/20 px-6 py-4">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-warning/15 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight">購入前の注意点</h2>
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

        {/* 6. 他の候補 */}
        <SectionCard title="他の候補" icon={<Sparkles className="h-4 w-4" />} delay="420ms">
          <div className="grid gap-3 sm:grid-cols-3">
            {ALTERNATIVES.map((alt, i) => (
              <AlternativeCard key={alt.name} product={alt} delay={`${i * 60}ms`} />
            ))}
          </div>
        </SectionCard>

        {/* 7. 次のステップ */}
        <div
          className="animate-fade-in rounded-2xl border border-border bg-card/40 p-6 backdrop-blur"
          style={{ animationDelay: "490ms" }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/40 px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all hover-scale hover:text-foreground"
              >
                他の商品も比較しますか？
              </Link>
              <Link
                to="/ask"
                search={{ q, maker, model, year } as never}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover-scale hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" />
                予算を変える
              </Link>
            </div>
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
