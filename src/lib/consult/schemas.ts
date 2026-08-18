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

export const ConsultChatOutputSchema = z.object({
  content: z.string().min(1),
  phase: z.literal("advise"),
});
