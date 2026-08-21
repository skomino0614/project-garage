import { describe, expect, it } from "vitest";

import { getSafeProductImageUrl } from "@/lib/product/product-image-url";

describe("ProductImage display guard", () => {
  it("treats DAYTONA placeholder URL as absent so UI can show fallback", () => {
    expect(getSafeProductImageUrl("https://example.com/images/daytona.jpg")).toBeNull();
  });

  it("keeps VOUGE product image URL usable", () => {
    const url = "https://www.rayswheels.co.jp/lacne/news/upload/wheel/HP_VOUGE_BD2_5H_003.jpg";
    expect(getSafeProductImageUrl(url)).toBe(url);
  });
});
