import type { VehicleContext } from "@/lib/consult/types";

import type { PriorityAttributeKey, PriorityLevel } from "./constants";
import type { Product } from "./types";

/** Vehicle fitment outcome for a product — never treat "unknown" as compatible. */
export type VehicleCompatibilityStatus = "compatible" | "unknown" | "incompatible";

/** Match input aligned with ConsultationSummary / ConsultSlots (Phase 5). */
export type ProductMatchInput = {
  vehicle: VehicleContext;
  budget: {
    maxYen: number | null;
  };
  category: string | null;
  usage: string | null;
  stylePreference: string | null;
  priorities: Record<PriorityAttributeKey, PriorityLevel>;
  /** Optional free-form tags from consultation (e.g. "18インチ", "メッシュ"). */
  tags?: string[];
};

export type ProductMatchReason =
  | "予算内"
  | "予算内（上限付近）"
  | "予算をやや超過"
  | "見た目の優先度と一致"
  | "乗り心地の条件と一致"
  | "実用性の条件と一致"
  | "リセールの条件と一致"
  | "スタイルと一致"
  | "タグと一致"
  | "車種適合";

export type ProductMatchResult = {
  product: Product;
  score: number;
  reasons: ProductMatchReason[];
  vehicleCompatibility: VehicleCompatibilityStatus;
  isWithinBudget: boolean;
  priorityMatchCount: number;
};

export type RankProductMatchesOptions = {
  /** Number of top results to return (default 5, clamped 3–5). */
  limit?: number;
};
