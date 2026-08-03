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

const RecommendedSchema = z.object({
  name: z.string(),
  brand: z.string(),
  price: z.string(),
  image_query: z.string(),
  reason: z.array(z.string()),
  recommended_for: z.array(z.string()),
  warnings: z.array(z.string()),
});

const EvidenceSchema = z.object({
  maker_official: z.string(),
  owner_reviews: z.string(),
  youtube_reviews: z.string(),
  ai_overall: z.string(),
});

const ModelOutputSchema = z.object({
  summary: z.string(),
  recommended: RecommendedSchema,
  alternatives: z.array(AlternativeSchema),
  evidence: EvidenceSchema,
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
  evidence: EvidenceSchema,
});

export type AnswerResult = z.infer<typeof AnswerSchema>;

export const getAnswer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<AnswerResult> => {
    const { getOpenAI } = await import("./openai.server");
    const openai = getOpenAI();

    const car = [data.year, data.maker, data.model].filter(Boolean).join(" ");

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ModelOutputSchema,
      system: [
        "【役割】",
        "あなたはカー用品専門店で15年以上勤務したプロスタッフです。",
        "ユーザーに「一番おすすめの商品」を自信を持って提案してください。",
        "",
        "【回答ルール】",
        "必ず指定されたJSONスキーマに厳密に従って返してください。日本語で回答してください。",
        "提案は必ず「コスパ」「信頼性」「人気」「耐久性」の4点を考慮して選定してください。",
        "reason の3項目にはこの4つの観点のうち該当するものを具体的な根拠として書いてください。",
        "実在する商品のみを挙げてください。分からない場合や情報が不確かな場合は推測せず、",
        "summary にその旨（例:「この条件では確実な情報がないため、店頭での相談をおすすめします。」）を書いてください。",
        "価格は日本円で「¥XX,XXX 前後」の形式で記載してください。",
        "image_query には Google画像検索でその商品が確実にヒットする、ブランド名を含む正式な商品名（英数字表記優先）を入れてください。例:「70mai Dash Cam A810」。",
        "reason は3つ、recommended_for は3つ、warnings は2つ、alternatives は3つ入れてください。",
        "summary は短い一言キャッチにしてください。",
      ].join("\n"),
      prompt: `車: ${car || "不明"}\n質問: ${data.q}\n\n上記に最適な商品を、指定のJSON形式で返してください。`,
    });

    const r = object.recommended;
    return {
      title: r.name,
      brand: r.brand,
      price: r.price,
      summary: object.summary,
      image_query: r.image_query,
      reason: r.reason,
      recommended_for: r.recommended_for,
      warnings: r.warnings,
      alternatives: object.alternatives,
    };
  });

