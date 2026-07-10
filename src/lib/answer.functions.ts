import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";

const InputSchema = z.object({
  q: z.string().min(1),
  maker: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
});

const AnswerSchema = z.object({
  product: z.object({
    name: z.string(),
    price: z.string(),
    rating: z.number(),
    reviews: z.number(),
    tagline: z.string(),
  }),
  conditions: z.array(z.object({ label: z.string(), value: z.string() })),
  reasons: z.array(z.string()),
  recommendedFor: z.array(z.string()),
  cautions: z.array(z.string()),
  alternatives: z.array(
    z.object({
      name: z.string(),
      rating: z.number(),
      price: z.string(),
      bestFor: z.string(),
    }),
  ),
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
      system:
        "あなたは日本の車カスタムの専門家です。ユーザーの車と質問から、最適な商品提案をJSONで返してください。価格は日本円で「¥XX,XXX 前後」形式。ratingは0-5の小数、reviewsは件数。日本語で回答。",
      prompt: `車: ${car || "不明"}\n質問: ${data.q}\n\n以下を返してください:\n- product: 一番のおすすめ商品 (name, price, rating, reviews, tagline)\n  taglineは「この条件ならこれがベストです。」のような一言\n- conditions: ユーザーの条件を4項目 (車種/予算/重視/用途 など、labelとvalue)\n- reasons: おすすめする理由を3つ\n- recommendedFor: こんな人におすすめを3項目\n- cautions: 購入前の注意点を3項目\n- alternatives: 他の候補を3つ (name, rating, price, bestFor)`,
    });

    return object;
  });
