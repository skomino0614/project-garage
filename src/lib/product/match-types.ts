import type { VehicleContext } from "@/lib/consult/types";

import type { PriorityAttributeKey, PriorityLevel } from "./constants";
import type { Product } from "./types";

/** Vehicle fitment outcome for a product — never treat "unknown" as confirmed/reference. */
export type VehicleCompatibilityStatus = "confirmed" | "reference" | "unknown" | "incompatible";

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
  | "車種適合"
  | "参考適合";

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

/** Score component maximums — total capped at 100. */
export const MATCH_SCORE_MAX = 100 as const;
export const VEHICLE_COMPATIBILITY_SCORE = {
  confirmed: 35,
  reference: 25,
  unknown: 0,
  incompatible: 0,
} as const;
export const BUDGET_SCORE_MAX = 25 as const;
export const PRIORITY_SCORE_MAX = 30 as const;
export const STYLE_SCORE_MAX = 5 as const;
export const TAG_SCORE_MAX = 5 as const;
