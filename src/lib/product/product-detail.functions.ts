import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  GetProductClickCountsInputSchema,
  getProductClickCounts,
  RecordProductClickInputSchema,
  recordProductClickEvent,
} from "./click-events";
import { getSafeExternalUrl } from "./external-url";
import { fetchProductDetail } from "./product-detail";

const ProductDetailInputSchema = z.object({
  productId: z.string().uuid(),
});

export type ProductDetailResponse = {
  status: "active" | "inactive" | "not_found";
  product: {
    id: string;
    category: string;
    name: string;
    brand: string;
    description: string | null;
    priceMinYen: number;
    priceMaxYen: number;
    imageUrl: string | null;
    productUrl: string | null;
    purchaseUrl: string | null;
    compatibilities: Array<{
      maker: string;
      model: string;
      series: string | null;
      note: string | null;
      carMasterId: string | null;
    }>;
  } | null;
};

function toProductDetailResponse(
  result: Awaited<ReturnType<typeof fetchProductDetail>>,
): ProductDetailResponse {
  if (result.status === "not_found" || !result.product) {
    return { status: "not_found", product: null };
  }

  const product = result.product;

  return {
    status: result.status,
    product: {
      id: product.id,
      category: product.category,
      name: product.name,
      brand: product.brand,
      description: product.description,
      priceMinYen: product.priceMinYen,
      priceMaxYen: product.priceMaxYen,
      imageUrl: getSafeExternalUrl(product.imageUrl),
      productUrl: getSafeExternalUrl(product.productUrl),
      purchaseUrl: getSafeExternalUrl(product.purchaseUrl),
      compatibilities: product.compatibilities,
    },
  };
}

export const getProductDetail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ProductDetailInputSchema.parse(data))
  .handler(async ({ data }): Promise<ProductDetailResponse> => {
    const result = await fetchProductDetail(data.productId);
    return toProductDetailResponse(result);
  });

export const recordProductClick = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RecordProductClickInputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await recordProductClickEvent(data);
    } catch (error) {
      console.error("[recordProductClick] Failed:", error);
      return { recorded: false };
    }
  });

export const fetchProductClickCounts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GetProductClickCountsInputSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    return getProductClickCounts(data);
  });
