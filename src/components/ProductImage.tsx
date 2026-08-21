import { useState } from "react";

import { getSafeProductImageUrl } from "@/lib/product/product-image-url";

import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

type ProductImageProps = {
  imageUrl: string | null | undefined;
  alt?: string;
  className?: string;
  imageClassName?: string;
  placeholderLabel?: string;
};

export function ProductImage({
  imageUrl,
  alt = "",
  className = "aspect-[4/3] w-full overflow-hidden border-b border-border/60 bg-muted/20",
  imageClassName = "h-full w-full object-cover",
  placeholderLabel = "商品画像なし",
}: ProductImageProps) {
  const safeImageUrl = getSafeProductImageUrl(imageUrl);
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!safeImageUrl || hasLoadError) {
    return <ProductImagePlaceholder className={className} label={placeholderLabel} />;
  }

  return (
    <div className={className}>
      <img
        src={safeImageUrl}
        alt={alt}
        className={imageClassName}
        loading="lazy"
        onError={() => setHasLoadError(true)}
      />
    </div>
  );
}
