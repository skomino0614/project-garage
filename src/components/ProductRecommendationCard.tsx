import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import {
  formatCompatibilityLabel,
  formatMatchScore,
  formatProductPrice,
} from "@/lib/product/recommend-display";
import type { ProductRecommendationDisplayItem } from "@/lib/product/recommend-schemas";
import { saveProductRecommendationContext } from "@/lib/product/recommendation-context";

import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

type ProductRecommendationCardProps = {
  item: ProductRecommendationDisplayItem;
};

export function ProductRecommendationCard({ item }: ProductRecommendationCardProps) {
  const compatibilityLabel = formatCompatibilityLabel(
    item.vehicleCompatibility,
    item.compatibilities,
  );

  const handleNavigate = () => {
    saveProductRecommendationContext(item);
  };

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
      {item.imageUrl ? (
        <div className="aspect-[4/3] w-full overflow-hidden border-b border-border/60 bg-muted/20">
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <ProductImagePlaceholder />
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.brand}
          </p>
          <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
            {item.name}
          </h3>
          <p className="text-sm font-medium text-foreground/90">
            {formatProductPrice(item.priceMinYen, item.priceMaxYen)}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">{formatMatchScore(item.score)}</p>

        {item.vehicleCompatibility === "unknown" ? (
          <p className="text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
            適合情報を確認してください
          </p>
        ) : compatibilityLabel ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{compatibilityLabel}</p>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">おすすめ理由</p>
          <p className="text-sm leading-relaxed text-foreground/90">{item.reason}</p>
        </div>

        {item.highlights.length > 0 ? (
          <ul className="space-y-1 text-sm leading-relaxed text-foreground/85">
            {item.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span aria-hidden className="text-muted-foreground">
                  ・
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {item.caution ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            {item.caution}
          </p>
        ) : null}

        <div className="mt-auto pt-1">
          <Link
            to="/products/$productId"
            params={{ productId: item.productId }}
            onClick={handleNavigate}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            詳細を見る
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
