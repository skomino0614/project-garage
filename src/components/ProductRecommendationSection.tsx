import { RECOMMENDATION_GRID_CLASS } from "@/lib/product/recommend-display";
import type { ProductRecommendationDisplayItem } from "@/lib/product/recommend-schemas";

import { ProductRecommendationCard } from "./ProductRecommendationCard";

type ProductRecommendationSectionProps = {
  items: ProductRecommendationDisplayItem[];
  loading: boolean;
  error?: boolean;
  empty?: boolean;
  scrollMarginBottom?: number;
};

const EMPTY_MESSAGE =
  "現在、条件に合う商品が見つかりませんでした。予算や条件を少し変えると、候補をご紹介できます。";

const ERROR_MESSAGE =
  "商品情報の取得に失敗しました。もう一度お試しください。";

export function ProductRecommendationSection({
  items,
  loading,
  error = false,
  empty = false,
  scrollMarginBottom,
}: ProductRecommendationSectionProps) {
  if (loading) {
    return (
      <section
        aria-live="polite"
        className="animate-fade-in rounded-2xl border border-border/70 bg-card/40 px-4 py-3 backdrop-blur"
      >
        <p className="text-sm text-muted-foreground">
          あなたに合いそうな商品を探しています…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-live="polite"
        className="animate-fade-in rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 backdrop-blur"
      >
        <p className="text-sm text-destructive">{ERROR_MESSAGE}</p>
      </section>
    );
  }

  if (empty) {
    return (
      <section
        aria-live="polite"
        className="animate-fade-in rounded-2xl border border-border/70 bg-card/40 px-4 py-3 backdrop-blur"
      >
        <p className="text-sm text-muted-foreground">{EMPTY_MESSAGE}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="product-recommendations-title"
      className="animate-fade-in space-y-3"
      style={scrollMarginBottom ? { scrollMarginBottom } : undefined}
    >
      <div>
        <h2
          id="product-recommendations-title"
          className="text-sm font-semibold text-foreground sm:text-base"
        >
          あなたにおすすめ
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          いまの相談条件に基づく候補です
        </p>
      </div>

      <div className={RECOMMENDATION_GRID_CLASS}>
        {items.map((item) => (
          <ProductRecommendationCard key={item.productId} item={item} />
        ))}
      </div>
    </section>
  );
}

export { RECOMMENDATION_GRID_CLASS };
