import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";

const InputSchema = z.object({
  q: z.string().min(1),
  maker: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
});

const AlternativeSchema = z.object({
  name: z.string(),
  brand: z.string(),
  price: z.string(),
  image_query: z.string(),
});

const AnswerSchema = z.object({
  title: z.string(),
  brand: z.string(),
  price: z.string(),
  summary: z.string(),
  image_query: z.string(),
  reason: z.array(z.string()),
  recommended_for: z.array(z.string()),
  warnings: z.array(z.string()),
  alternatives: z.array(AlternativeSchema),
});

export type AnswerResult = z.infer<typeof AnswerSchema>;

export const getAnswer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { getOpenAI } = await import("./openai.server");
    const openai = getOpenAI();

    const car = [data.year, data.maker, data.model].filter(Boolean).join(" ");

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: AnswerSchema,
      system: [
        "あなたは日本の車カスタム・アフターパーツの専門家です。",
        "ユーザーの車と質問に対して、その車に本当に最適な1つの商品を提案してください。",
        "回答は必ず指定されたJSONスキーマに厳密に従ってください。日本語で回答してください。",
        "価格は日本円で「¥XX,XXX 前後」の形式で記載してください。",
        "image_query には Google画像検索でその商品が確実にヒットする、ブランド名を含む正式な商品名（英数字表記優先）を入れてください。例:「70mai Dash Cam A810」。",
        "reason は3つ、recommended_for は3つ、warnings は2〜3つ、alternatives は3つ入れてください。",
        "summary は「この条件ならこれがベストです。」のような短い一言キャッチにしてください。",
      ].join("\n"),
      prompt: `車: ${car || "不明"}\n質問: ${data.q}\n\n上記に最適な商品を、指定のJSON形式で返してください。`,
    });

    return object;
  });
