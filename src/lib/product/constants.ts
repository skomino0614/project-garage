/** Product categories aligned with consult UI chips (extensible via schema updates). */
export const PRODUCT_CATEGORIES = [
  "ドラレコ",
  "ホイール",
  "タイヤ",
  "車高調",
  "コーティング",
  "リセール",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Same priority scale as consult slots (ConsultSlots.priorities). */
export const PRIORITY_LEVELS = ["high", "medium", "low", "unknown"] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/** Structured product styles for future recommendation matching. */
export const PRODUCT_STYLES = [
  "純正風",
  "高級感",
  "スポーティ",
  "シンプル",
  "ワイルド",
  "その他",
] as const;

export type ProductStyle = (typeof PRODUCT_STYLES)[number];

export const PRIORITY_ATTRIBUTE_KEYS = [
  "appearance",
  "comfort",
  "practicality",
  "resale",
] as const;

export type PriorityAttributeKey = (typeof PRIORITY_ATTRIBUTE_KEYS)[number];
