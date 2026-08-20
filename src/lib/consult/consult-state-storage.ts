import { z } from "zod";

import { ConsultPrioritiesSchema, VehicleContextSchema } from "@/lib/consult/schemas";
import type { ConsultationSummary } from "@/lib/consult/types";
import { ProductRecommendationDisplayItemSchema } from "@/lib/product/recommend-schemas";

export const CONSULT_STATE_STORAGE_KEY = "garage:consult-state";
export const CONSULT_STATE_VERSION = 1 as const;

const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ConsultationSummarySchema = z.object({
  vehicle: VehicleContextSchema,
  budget: z.object({
    maxYen: z.number().nullable(),
    note: z.string().nullable(),
  }),
  category: z.string().nullable(),
  usage: z.string().nullable(),
  stylePreference: z.string().nullable(),
  priorities: ConsultPrioritiesSchema,
  direction: z.string().nullable(),
});

const RecommendationStateSchema = z.object({
  loading: z.boolean(),
  items: z.array(ProductRecommendationDisplayItemSchema),
  error: z.boolean(),
  requestKey: z.string().nullable(),
});

export const StoredConsultStateSchema = z.object({
  version: z.literal(CONSULT_STATE_VERSION),
  vehicle: VehicleContextSchema,
  messages: z.array(ChatMessageSchema).min(1),
  summary: ConsultationSummarySchema.nullable(),
  recommendations: RecommendationStateSchema,
  scrollTop: z.number().nonnegative().optional(),
});

export type StoredChatMessage = z.infer<typeof ChatMessageSchema>;
export type StoredConsultState = z.infer<typeof StoredConsultStateSchema>;

export type ConsultPersistedSnapshot = {
  messages: StoredChatMessage[];
  summary: ConsultationSummary | null;
  recommendations: StoredConsultState["recommendations"];
  scrollTop?: number;
};

export function buildVehicleKey(maker: string, model: string, series: string): string {
  return `${maker}::${model}::${series}`;
}

export function vehicleMatchesStored(
  stored: StoredConsultState,
  maker: string,
  model: string,
  series: string,
): boolean {
  return (
    stored.vehicle.maker === maker &&
    stored.vehicle.model === model &&
    stored.vehicle.series === series
  );
}

export function saveConsultState(
  maker: string,
  model: string,
  series: string,
  snapshot: ConsultPersistedSnapshot,
): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const payload: StoredConsultState = {
    version: CONSULT_STATE_VERSION,
    vehicle: { maker, model, series },
    messages: snapshot.messages,
    summary: snapshot.summary,
    recommendations: snapshot.recommendations,
    scrollTop: snapshot.scrollTop,
  };

  sessionStorage.setItem(CONSULT_STATE_STORAGE_KEY, JSON.stringify(payload));
}

export function loadConsultState(
  maker: string,
  model: string,
  series: string,
): StoredConsultState | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(CONSULT_STATE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = StoredConsultStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return null;
    }

    if (!vehicleMatchesStored(parsed.data, maker, model, series)) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function clearConsultState(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(CONSULT_STATE_STORAGE_KEY);
}
