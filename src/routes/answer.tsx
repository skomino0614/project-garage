import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Camera,
} from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import type { AnswerResult } from "@/lib/answer.functions";

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

const FALLBACK: AnswerResult = {
  title: "70mai Dash Cam A810",
  brand: "70mai",
  price: "¥35,000 前後",
  summary: "この条件ならこれがベストです。",
  image_query: "70mai Dash Cam A810",
  reason: [
    "ワイドなフロントガラスに前後2カメラが設置しやすい",
    "夜間のノイズ抑制とナンバー読み取り性能が高い",
    "駐車監視オプションで普段使いもカバーできる",
  ],
  recommended_for: [
    "4K前後撮影とナンバー読み取りを重視する人",
    "スマホで簡単に映像を確認したい人",
    "駐車監視であおり運転や当て逃げを防ぎたい人",
  ],
  warnings: [
    "前後カメラの配線は専門店での取り付けを推奨",
    "microSDの容量・耐久性を確認（高耐久品を選ぶ）",
    "常時電源が必要な駐車監視はバッテリーへの影響を把握",
  ],
  alternatives: [
    { name: "DRY-WiFiV3c", brand: "Yupiteru", price: "¥45,000 前後", image_query: "Yupiteru DRY-WiFiV3c" },
    { name: "DRV-MN940", brand: "KENWOOD", price: "¥55,000 前後", image_query: "KENWOOD DRV-MN940" },
    { name: "VREC-DH300D", brand: "Pioneer", price: "¥28,000 前後", image_query: "Pioneer VREC-DH300D" },
  ],
  evidence: {
    maker_official: "",
    owner_reviews: "",
    youtube_reviews: "",
    ai_overall: "",
  },
};

function imageUrl(query: string) {
  return `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;
}

function AnswerPage() {
  const { q, maker, model, year } = Route.useSearch();
  const [data, setData] = useState<AnswerResult>(FALLBACK);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("garage:answer");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { result?: AnswerResult };
      if (parsed?.result) setData(parsed.result);
    } catch (e) {
      console.error(e);
    }
  }, []);

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

        {/* 商品カード */}
        <section className="animate-fade-in mb-6" style={{ animationDelay: "70ms" }}>
          <div className="overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur transition-all hover:border-primary/40">
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img
                src={imageUrl(data.image_query)}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" />
                {data.summary}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {data.brand}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.title}
              </h2>
              <p className="mt-3 text-lg font-semibold text-foreground">{data.price}</p>
            </div>
          </div>
        </section>

        {/* あなたにおすすめする理由 */}
        <SectionCard
          title="あなたにおすすめする理由"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delay="210ms"
        >
          <ul className="space-y-3">
            {data.reason.map((r) => (
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

        {/* こんな人におすすめ */}
        <SectionCard
          title="こんな人におすすめ"
          icon={<Sparkles className="h-4 w-4" />}
          delay="280ms"
        >
          <ul className="space-y-3">
            {data.recommended_for.map((r) => (
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

        {/* 購入前の注意点 */}
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
            {data.warnings.map((c) => (
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

        {/* 他の候補 */}
        <SectionCard title="他の候補" icon={<Sparkles className="h-4 w-4" />} delay="420ms">
          <div className="grid gap-3 sm:grid-cols-3">
            {data.alternatives.map((alt, i) => (
              <AlternativeCard key={alt.name} product={alt} delay={`${i * 60}ms`} />
            ))}
          </div>
        </SectionCard>

        {/* 次のステップ */}
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
  product: AnswerResult["alternatives"][number];
  delay: string;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="animate-fade-in group rounded-xl border border-border/70 bg-background/40 p-4 transition-all hover:border-primary/60"
      style={{ animationDelay: delay }}
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted/50">
        {imgError ? (
          <Camera className="h-8 w-8 text-muted-foreground/50" />
        ) : (
          <img
            src={imageUrl(product.image_query)}
            alt={product.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {product.brand}
      </p>
      <h3 className="mt-0.5 text-sm font-semibold">{product.name}</h3>
      <p className="mt-2 text-sm font-semibold">{product.price}</p>
    </div>
  );
}
