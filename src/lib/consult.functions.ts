import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { ConsultChatInputSchema, ConsultChatOutputSchema } from "./consult/schemas";
import { buildConsultSystemPrompt, buildConsultUserPrompt } from "./consult/prompts/system";
import type { ConsultChatResponse } from "./consult/types";

export const consultChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ConsultChatInputSchema.parse(data))
  .handler(async ({ data }): Promise<ConsultChatResponse> => {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[consultChat] OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_NOT_CONFIGURED");
    }

    const { getOpenAI } = await import("./openai.server");
    const openai = getOpenAI();

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ConsultChatOutputSchema,
      system: buildConsultSystemPrompt(data.vehicle),
      prompt: buildConsultUserPrompt(data.messages),
    });

    return object;
  });
