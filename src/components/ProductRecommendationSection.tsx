import { RECOMMENDATION_GRID_CLASS } from "@/lib/product/recommend-display";
import type { ProductRecommendationDisplayItem } from "@/lib/product/recommend-schemas";

import { ProductRecommendationCard } from "./ProductRecommendationCard";

type ProductRecommendationSectionProps = {
  items: ProductRecommendationDisplayItem[];
  loading: boolean;
};

export function ProductRecommendationSection({
  items,
  loading,
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

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="product-recommendations-title" className="animate-fade-in space-y-3">
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
