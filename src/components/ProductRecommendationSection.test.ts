import { describe, expect, it } from "vitest";

/**
 * ProductRecommendationSection display messages (Phase 6-6).
 * Component rendering is covered manually; keep copy stable for UX regression checks.
 */
const EMPTY_MESSAGE =
  "現在、条件に合う商品が見つかりませんでした。予算や条件を少し変えると、候補をご紹介できます。";

const ERROR_MESSAGE =
  "商品情報の取得に失敗しました。もう一度お試しください。";

describe("ProductRecommendationSection messages", () => {
  it("uses the agreed empty-state copy", () => {
    expect(EMPTY_MESSAGE).toContain("条件に合う商品が見つかりませんでした");
  });

  it("uses the agreed error-state copy", () => {
    expect(ERROR_MESSAGE).toContain("商品情報の取得に失敗しました");
  });
});
