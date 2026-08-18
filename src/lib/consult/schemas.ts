import { z } from "zod";

export const VehicleContextSchema = z.object({
  maker: z.string().min(1),
  model: z.string().min(1),
  series: z.string().min(1),
});

export const ConsultMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const ConsultChatInputSchema = z.object({
  vehicle: VehicleContextSchema,
  messages: z.array(ConsultMessageSchema).min(1).max(50),
});

export const PriorityLevelSchema = z.enum(["high", "medium", "low", "unknown"]);

export const ConsultPrioritiesSchema = z.object({
  appearance: PriorityLevelSchema,
  comfort: PriorityLevelSchema,
  practicality: PriorityLevelSchema,
  resale: PriorityLevelSchema,
});

export const ConsultSlotsSchema = z.object({
  budgetMaxYen: z.number().nullable(),
  budgetNote: z.string().nullable(),
  category: z.string().nullable(),
  usage: z.string().nullable(),
  stylePreference: z.string().nullable(),
  priorities: ConsultPrioritiesSchema,
});

export const ConsultChatOutputSchema = z.object({
  content: z.string().min(1),
  phase: z.enum(["clarify", "advise"]),
  followUpQuestion: z.string().nullable(),
  slots: ConsultSlotsSchema,
});
