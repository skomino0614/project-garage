import type { VehicleContext } from "@/lib/consult/types";
import type { ConsultationSummary } from "@/lib/consult/types";

import {
  PRIORITY_ATTRIBUTE_KEYS,
  type PriorityAttributeKey,
  type PriorityLevel,
} from "./constants";
import type {
  ProductMatchInput,
  ProductMatchReason,
  ProductMatchResult,
  RankProductMatchesOptions,
  VehicleCompatibilityStatus,
} from "./match-types";
import {
  BUDGET_SCORE_MAX,
  MATCH_SCORE_MAX,
  PRIORITY_SCORE_MAX,
  STYLE_SCORE_MAX,
  TAG_SCORE_MAX,
  VEHICLE_COMPATIBILITY_SCORE,
} from "./match-types";
import type { Product, VehicleCompatibility } from "./types";

/** Budget exclusion threshold — products above this ratio are filtered out. */
const BUDGET_EXCLUSION_RATIO = 1.2;

/** Slightly-over-budget upper bound for scoring (not exclusion). */
const BUDGET_SLIGHT_OVER_RATIO = 1.15;

const PRIORITY_DIMENSION_WEIGHTS: Record<PriorityAttributeKey, number> = {
  appearance: 25,
  comfort: 20,
  practicality: 15,
  resale: 15,
};

const USER_PRIORITY_MULTIPLIERS: Record<Exclude<PriorityLevel, "unknown">, number> = {
  high: 1,
  medium: 0.7,
  low: 0.3,
};

const PRIORITY_LEVEL_VALUES: Record<PriorityLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

const PRIORITY_REASONS: Record<PriorityAttributeKey, ProductMatchReason> = {
  appearance: "見た目の優先度と一致",
  comfort: "乗り心地の条件と一致",
  practicality: "実用性の条件と一致",
  resale: "リセールの条件と一致",
};

const ALIGNMENT_THRESHOLD = 0.75;

export function consultationSummaryToMatchInput(
  summary: ConsultationSummary,
): ProductMatchInput {
  return {
    vehicle: summary.vehicle,
    budget: summary.budget,
    category: summary.category,
    usage: summary.usage,
    stylePreference: summary.stylePreference,
    priorities: summary.priorities,
  };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function compatibilityMatchesVehicle(
  compat: VehicleCompatibility,
  vehicle: VehicleContext,
): boolean {
  if (normalizeText(compat.maker) !== normalizeText(vehicle.maker)) {
    return false;
  }
  if (normalizeText(compat.model) !== normalizeText(vehicle.model)) {
    return false;
  }
  if (compat.series === null) {
    return true;
  }
  return normalizeText(compat.series) === normalizeText(vehicle.series);
}

function hasExactSeriesMatch(product: Product, vehicle: VehicleContext): boolean {
  return product.compatibilities.some(
    (compat) =>
      compatibilityMatchesVehicle(compat, vehicle) &&
      compat.series !== null &&
      normalizeText(compat.series) === normalizeText(vehicle.series),
  );
}

export function getVehicleCompatibilityStatus(
  product: Product,
  vehicle: VehicleContext,
): VehicleCompatibilityStatus {
  if (product.compatibilities.length === 0) {
    return "unknown";
  }

  const matching = product.compatibilities.filter((compat) =>
    compatibilityMatchesVehicle(compat, vehicle),
  );

  if (matching.length === 0) {
    return "incompatible";
  }

  if (matching.some((compat) => compat.fitmentType === "confirmed")) {
    return "confirmed";
  }

  if (matching.some((compat) => compat.fitmentType === "reference")) {
    return "reference";
  }

  return "unknown";
}

function passesCategoryFilter(product: Product, category: string | null): boolean {
  if (category === null || category.trim() === "") {
    return true;
  }
  return normalizeText(product.category) === normalizeText(category);
}

function passesBudgetFilter(product: Product, maxYen: number | null): boolean {
  if (maxYen === null || maxYen <= 0) {
    return true;
  }
  return product.priceMinYen <= maxYen * BUDGET_EXCLUSION_RATIO;
}

function isWithinBudget(product: Product, maxYen: number | null): boolean {
  if (maxYen === null || maxYen <= 0) {
    return true;
  }
  return product.priceMinYen <= maxYen;
}

function attributeAlignmentScore(
  userPriority: Exclude<PriorityLevel, "unknown">,
  productLevel: PriorityLevel,
): number {
  const userValue = PRIORITY_LEVEL_VALUES[userPriority];
  const productValue =
    productLevel === "unknown" ? PRIORITY_LEVEL_VALUES.medium : PRIORITY_LEVEL_VALUES[productLevel];

  const diff = Math.abs(userValue - productValue);
  return Math.max(0, 1 - diff / 2);
}

function scoreVehicleCompatibility(status: VehicleCompatibilityStatus): {
  score: number;
  reasons: ProductMatchReason[];
} {
  const score = VEHICLE_COMPATIBILITY_SCORE[status];
  const reasons: ProductMatchReason[] = [];

  if (status === "confirmed") {
    reasons.push("車種適合");
  } else if (status === "reference") {
    reasons.push("参考適合");
  }

  return { score, reasons };
}

function scoreBudget(
  product: Product,
  maxYen: number | null,
): { score: number; reasons: ProductMatchReason[]; withinBudget: boolean } {
  if (maxYen === null || maxYen <= 0) {
    return { score: BUDGET_SCORE_MAX, reasons: [], withinBudget: true };
  }

  if (product.priceMaxYen <= maxYen) {
    return { score: BUDGET_SCORE_MAX, reasons: ["予算内"], withinBudget: true };
  }

  if (product.priceMinYen <= maxYen) {
    return {
      score: Math.round(BUDGET_SCORE_MAX * 0.8),
      reasons: ["予算内（上限付近）"],
      withinBudget: true,
    };
  }

  if (product.priceMinYen <= maxYen * BUDGET_SLIGHT_OVER_RATIO) {
    return {
      score: Math.round(BUDGET_SCORE_MAX * 0.4),
      reasons: ["予算をやや超過"],
      withinBudget: false,
    };
  }

  return { score: 0, reasons: [], withinBudget: false };
}

function scorePriorities(
  input: ProductMatchInput,
  product: Product,
): { score: number; reasons: ProductMatchReason[]; matchCount: number } {
  let activeWeight = 0;
  let earnedWeight = 0;
  const reasons: ProductMatchReason[] = [];
  let matchCount = 0;

  for (const key of PRIORITY_ATTRIBUTE_KEYS) {
    const userPriority = input.priorities[key];
    if (userPriority === "unknown") {
      continue;
    }

    const dimensionWeight = PRIORITY_DIMENSION_WEIGHTS[key];
    const userMultiplier = USER_PRIORITY_MULTIPLIERS[userPriority];
    const weightedDimension = dimensionWeight * userMultiplier;
    activeWeight += weightedDimension;

    const alignment = attributeAlignmentScore(userPriority, product.attributes[key]);
    earnedWeight += weightedDimension * alignment;

    if (alignment >= ALIGNMENT_THRESHOLD) {
      reasons.push(PRIORITY_REASONS[key]);
      matchCount += 1;
    }
  }

  if (activeWeight === 0) {
    return { score: 0, reasons, matchCount: 0 };
  }

  const score = (earnedWeight / activeWeight) * PRIORITY_SCORE_MAX;

  return { score, reasons, matchCount };
}

function scoreStyle(
  stylePreference: string | null,
  product: Product,
): { score: number; reasons: ProductMatchReason[] } {
  if (stylePreference === null || stylePreference.trim() === "") {
    return { score: 0, reasons: [] };
  }

  if (normalizeText(product.style) === normalizeText(stylePreference)) {
    return { score: STYLE_SCORE_MAX, reasons: ["スタイルと一致"] };
  }

  return { score: 0, reasons: [] };
}

function collectUserTags(input: ProductMatchInput): string[] {
  const tags = new Set<string>();

  for (const tag of input.tags ?? []) {
    if (tag.trim()) {
      tags.add(normalizeText(tag));
    }
  }

  if (input.stylePreference?.trim()) {
    tags.add(normalizeText(input.stylePreference));
  }

  if (input.usage?.trim()) {
    tags.add(normalizeText(input.usage));
  }

  return [...tags];
}

function scoreTags(input: ProductMatchInput, product: Product): { score: number; reasons: ProductMatchReason[] } {
  const userTags = collectUserTags(input);
  if (userTags.length === 0 || product.tags.length === 0) {
    return { score: 0, reasons: [] };
  }

  const productTags = product.tags.map(normalizeText);
  const matchCount = userTags.filter((tag) => productTags.includes(tag)).length;

  if (matchCount === 0) {
    return { score: 0, reasons: [] };
  }

  const score = Math.min(matchCount * 2, TAG_SCORE_MAX);
  return { score, reasons: ["タグと一致"] };
}

function clampMatchScore(score: number): number {
  return Math.min(MATCH_SCORE_MAX, Math.max(0, Math.round(score)));
}

export function scoreProductMatch(
  product: Product,
  input: ProductMatchInput,
): ProductMatchResult | null {
  if (!product.isActive) {
    return null;
  }

  if (!passesCategoryFilter(product, input.category)) {
    return null;
  }

  const vehicleCompatibility = getVehicleCompatibilityStatus(product, input.vehicle);
  if (vehicleCompatibility === "incompatible") {
    return null;
  }

  if (!passesBudgetFilter(product, input.budget.maxYen)) {
    return null;
  }

  const vehicle = scoreVehicleCompatibility(vehicleCompatibility);
  const budget = scoreBudget(product, input.budget.maxYen);
  const priorities = scorePriorities(input, product);
  const style = scoreStyle(input.stylePreference, product);
  const tags = scoreTags(input, product);

  const reasons: ProductMatchReason[] = [
    ...vehicle.reasons,
    ...budget.reasons,
    ...priorities.reasons,
    ...style.reasons,
    ...tags.reasons,
  ];

  const score = clampMatchScore(
    vehicle.score + budget.score + priorities.score + style.score + tags.score,
  );

  return {
    product,
    score,
    reasons,
    vehicleCompatibility,
    isWithinBudget: budget.withinBudget,
    priorityMatchCount: priorities.matchCount,
  };
}

export function compareProductMatchResults(
  a: ProductMatchResult,
  b: ProductMatchResult,
  input: ProductMatchInput,
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  const vehicleRank = (status: VehicleCompatibilityStatus) => {
    if (status === "confirmed") return 3;
    if (status === "reference") return 2;
    if (status === "unknown") return 1;
    return 0;
  };

  const vehicleDiff = vehicleRank(b.vehicleCompatibility) - vehicleRank(a.vehicleCompatibility);
  if (vehicleDiff !== 0) {
    return vehicleDiff;
  }

  const exactA = hasExactSeriesMatch(a.product, input.vehicle) ? 1 : 0;
  const exactB = hasExactSeriesMatch(b.product, input.vehicle) ? 1 : 0;
  if (exactB !== exactA) {
    return exactB - exactA;
  }

  if (Number(b.isWithinBudget) !== Number(a.isWithinBudget)) {
    return Number(b.isWithinBudget) - Number(a.isWithinBudget);
  }

  if (b.priorityMatchCount !== a.priorityMatchCount) {
    return b.priorityMatchCount - a.priorityMatchCount;
  }

  const budgetMax = input.budget.maxYen;
  if (budgetMax !== null && budgetMax > 0) {
    const distanceA = Math.abs(a.product.priceMinYen - budgetMax);
    const distanceB = Math.abs(b.product.priceMinYen - budgetMax);
    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }
  }

  return a.product.id.localeCompare(b.product.id);
}

export function rankProductMatches(
  products: Product[],
  input: ProductMatchInput,
  options: RankProductMatchesOptions = {},
): ProductMatchResult[] {
  const rawLimit = options.limit ?? 5;
  const limit = Math.min(5, Math.max(3, rawLimit));

  const results = products
    .map((product) => scoreProductMatch(product, input))
    .filter((result): result is ProductMatchResult => result !== null)
    .sort((a, b) => compareProductMatchResults(a, b, input));

  return results.slice(0, limit);
}

/** Alias for scoring a single product (returns null when filtered out). */
export function matchProductToConsultation(
  product: Product,
  input: ProductMatchInput,
): ProductMatchResult | null {
  return scoreProductMatch(product, input);
}
