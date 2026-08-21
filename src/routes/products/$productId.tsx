import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import { ProductImage } from "@/components/ProductImage";
import {
  formatCompatibilityLabel,
  formatMatchScore,
  formatProductPrice,
} from "@/lib/product/recommend-display";
import {
  getProductDetail,
  recordProductClick,
  type ProductDetailResponse,
} from "@/lib/product/product-detail.functions";
import {
  loadProductRecommendationContext,
  type StoredProductRecommendationContext,
} from "@/lib/product/recommendation-context";

export const Route = createFileRoute("/products/$productId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.productId} — Project Garage` }],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const fetchDetail = useServerFn(getProductDetail);
  const trackClick = useServerFn(recordProductClick);
  const [detail, setDetail] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<StoredProductRecommendationContext | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      try {
        const response = await fetchDetail({ data: { productId } });
        if (!cancelled) {
          setDetail(response);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setDetail({ status: "not_found", product: null });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [fetchDetail, productId]);

  useEffect(() => {
    setRecommendation(loadProductRecommendationContext(productId));
  }, [productId]);

  useEffect(() => {
    if (detail?.status !== "active" || !detail.product) {
      return;
    }

    void trackClick({
      data: {
        productId: detail.product.id,
        eventType: "product_detail",
      },
    }).catch(() => undefined);
  }, [detail, trackClick]);

  const compatibilityLabel = useMemo(() => {
    if (!recommendation) {
      return null;
    }

    return formatCompatibilityLabel(
      recommendation.vehicleCompatibility,
      recommendation.compatibilities,
    );
  }, [recommendation]);

  const handlePurchaseClick = () => {
    if (!detail?.product) {
      return;
    }

    void trackClick({
      data: {
        productId: detail.product.id,
        eventType: "purchase_click",
      },
    }).catch(() => undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GarageNav />
        <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
          <p className="text-sm text-muted-foreground">商品情報を読み込んでいます…</p>
        </main>
      </div>
    );
  }

  if (!detail || detail.status === "not_found" || !detail.product) {
    return (
      <div className="min-h-screen bg-background">
        <GarageNav />
        <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
          <Link
            to="/consult"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            相談に戻る
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">商品が見つかりません</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            指定された商品は存在しないか、URLが正しくありません。
          </p>
        </main>
      </div>
    );
  }

  const product = detail.product;
  const isInactive = detail.status === "inactive";

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <Link
          to="/consult"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          相談に戻る
        </Link>

        <article className="overflow-hidden rounded-3xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
          <ProductImage imageUrl={product.imageUrl} />

          <div className="space-y-6 p-6 sm:p-8">
            {isInactive ? (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                この商品は現在取り扱いしていません。
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.brand}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
              <p className="text-lg font-medium text-foreground/90">
                {formatProductPrice(product.priceMinYen, product.priceMaxYen)}
              </p>
              <p className="text-sm text-muted-foreground">カテゴリ: {product.category}</p>
            </div>

            {product.description ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">商品説明</h2>
                <p className="text-sm leading-relaxed text-foreground/90">{product.description}</p>
              </section>
            ) : null}

            {product.compatibilities.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">適合車種</h2>
                <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
                  {product.compatibilities.map((compatibility) => {
                    const series = compatibility.series ? ` ${compatibility.series}` : "";
                    const note = compatibility.note ? `（${compatibility.note}）` : "";
                    return (
                      <li key={`${compatibility.maker}-${compatibility.model}-${compatibility.series ?? "none"}`}>
                        {compatibility.maker} {compatibility.model}
                        {series}
                        {note}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {recommendation ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">おすすめ理由</h2>
                <p className="text-xs text-muted-foreground">{formatMatchScore(recommendation.score)}</p>
                {recommendation.vehicleCompatibility === "unknown" ? (
                  <p className="text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
                    適合情報を確認してください
                  </p>
                ) : compatibilityLabel ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{compatibilityLabel}</p>
                ) : null}
                <p className="text-sm leading-relaxed text-foreground/90">{recommendation.reason}</p>
                {recommendation.highlights.length > 0 ? (
                  <ul className="space-y-1 text-sm leading-relaxed text-foreground/85">
                    {recommendation.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <span aria-hidden className="text-muted-foreground">
                          ・
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {recommendation.caution ? (
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                    {recommendation.caution}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              {!isInactive && product.purchaseUrl ? (
                <a
                  href={product.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePurchaseClick}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  ショップで見る
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              {!isInactive && product.productUrl ? (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  商品詳細を見る
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
