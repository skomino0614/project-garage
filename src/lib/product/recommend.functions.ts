import { createServerFn } from "@tanstack/react-start";

import { generateProductRecommendationReasons } from "./recommend";
import {
  RecommendProductReasonsInputSchema,
  type RecommendProductReasonsOutput,
} from "./recommend-schemas";

export const recommendProductReasons = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RecommendProductReasonsInputSchema.parse(data))
  .handler(async ({ data }): Promise<RecommendProductReasonsOutput> => {
    return generateProductRecommendationReasons(data);
  });
