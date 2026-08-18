import type { ConsultMessage, ConsultSlots, ConsultationSummary, PriorityLevel } from "./types";

const EMPTY_PRIORITIES: ConsultSlots["priorities"] = {
  appearance: "unknown",
  comfort: "unknown",
  practicality: "unknown",
  resale: "unknown",
};

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /ホイール|wheel/i, label: "ホイール" },
  { pattern: /ドラレコ|ドライブレコーダー/i, label: "ドラレコ" },
  { pattern: /タイヤ|tire/i, label: "タイヤ" },
  { pattern: /車高調|ローダウン/i, label: "車高調" },
  { pattern: /コーティング|コート/i, label: "コーティング" },
  { pattern: /リセール|売却|下取/i, label: "リセール" },
];

const PRIORITY_RULES: Array<{
  pattern: RegExp;
  key: keyof ConsultSlots["priorities"];
  label: string;
}> = [
  { pattern: /見た目|デザイン|かっこ/i, key: "appearance", label: "見た目" },
  { pattern: /乗り心地|快適|乗心地/i, key: "comfort", label: "乗り心地" },
  { pattern: /実用|使い勝手|日常|ファミリー|通勤/i, key: "practicality", label: "実用性" },
  { pattern: /リセール|売却|下取|残価/i, key: "resale", label: "リセール" },
];

const STYLE_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /純正|OEM|ノーマル|上品/i, label: "純正っぽく上品" },
  { pattern: /高級/i, label: "高級感" },
  { pattern: /スポーティ|スポーツ/i, label: "スポーティ寄り" },
];

function extractInch(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/(\d{2})\s*インチ/);
  return match?.[1] ?? null;
}

function formatBudget(maxYen: number | null, note: string | null): string | null {
  if (maxYen != null && maxYen > 0) {
    const man = Math.round(maxYen / 10000);
    return man > 0 ? `${man}万円以内` : `${maxYen.toLocaleString("ja-JP")}円以内`;
  }
  if (note?.trim()) return note.trim();
  return null;
}

function priorityDisplayLabels(priorities: ConsultSlots["priorities"]): string[] {
  const labels: Record<keyof ConsultSlots["priorities"], string> = {
    appearance: "見た目",
    comfort: "乗り心地",
    practicality: "実用性",
    resale: "リセール",
  };

  return (Object.keys(labels) as Array<keyof ConsultSlots["priorities"]>)
    .filter((key) => priorities[key] === "high" || priorities[key] === "medium")
    .map((key) => labels[key]);
}

function buildDirection(slots: ConsultSlots): string | null {
  const lead: string[] = [];

  const inch =
    extractInch(slots.stylePreference) ??
    extractInch(slots.usage) ??
    extractInch(slots.budgetNote) ??
    extractInch(slots.category);
  if (inch) lead.push(`${inch}インチ`);

  if (slots.stylePreference?.trim()) {
    const style = slots.stylePreference.trim();
    const matched = STYLE_RULES.find((rule) => rule.pattern.test(style));
    lead.push(matched?.label ?? style);
  }

  const emphasized = priorityDisplayLabels(slots.priorities).filter((label) => {
    const key = (
      {
        見た目: "appearance",
        乗り心地: "comfort",
        実用性: "practicality",
        リセール: "resale",
      } as const
    )[label as "見た目" | "乗り心地" | "実用性" | "リセール"];
    return key ? slots.priorities[key] === "high" : false;
  });

  if (emphasized.length >= 2) {
    const prefix = lead.length > 0 ? `${lead.join("・")}で、` : "";
    return `${prefix}${emphasized.join("と")}を両立する方向`;
  }

  if (emphasized.length === 1) {
    const prefix = lead.length > 0 ? `${lead.join("・")}で、` : "";
    return `${prefix}${emphasized[0]}を重視する方向`;
  }

  if (lead.length > 0) {
    return `${lead.join("・")}の方向`;
  }

  if (slots.category?.trim()) {
    return `${slots.category.trim()}のカスタムを検討中`;
  }

  return null;
}

export function buildConsultationSummary(
  maker: string,
  model: string,
  series: string,
  slots: ConsultSlots,
): ConsultationSummary {
  return {
    vehicle: { maker, model, series },
    budget: {
      maxYen: slots.budgetMaxYen,
      note: slots.budgetNote,
    },
    category: slots.category,
    usage: slots.usage,
    stylePreference: slots.stylePreference,
    priorities: slots.priorities,
    direction: buildDirection(slots),
  };
}

/** Mock fallback: infer slots from user messages without OpenAI. */
export function inferSlotsFromMessages(messages: ConsultMessage[]): ConsultSlots {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  let budgetMaxYen: number | null = null;
  const budgetMatch = userText.match(/(\d+)\s*万\s*円?/);
  if (budgetMatch) {
    budgetMaxYen = Number(budgetMatch[1]) * 10000;
  }

  let category: string | null = null;
  for (const { pattern, label } of CATEGORY_KEYWORDS) {
    if (pattern.test(userText)) {
      category = label;
      break;
    }
  }

  const priorities = { ...EMPTY_PRIORITIES };
  for (const rule of PRIORITY_RULES) {
    if (rule.pattern.test(userText)) {
      priorities[rule.key] = /重視|優先|大事|悪くしたくない|あまり/i.test(userText)
        ? "high"
        : "medium";
    }
  }

  let stylePreference: string | null = null;
  for (const rule of STYLE_RULES) {
    if (rule.pattern.test(userText)) {
      stylePreference = rule.label;
      break;
    }
  }

  const inch = extractInch(userText);
  if (inch && !stylePreference) {
    stylePreference = `${inch}インチ`;
  }

  let usage: string | null = null;
  if (/通勤/i.test(userText)) usage = "通勤";
  else if (/ファミリー|家族/i.test(userText)) usage = "ファミリー";
  else if (/週末/i.test(userText)) usage = "週末";

  return {
    budgetMaxYen,
    budgetNote: budgetMatch ? `${budgetMatch[1]}万円以内` : null,
    category,
    usage,
    stylePreference,
    priorities,
  };
}

export function formatBudgetLabel(summary: ConsultationSummary): string | null {
  return formatBudget(summary.budget.maxYen, summary.budget.note);
}

export function summaryPriorityLabels(summary: ConsultationSummary): string[] {
  return priorityDisplayLabels(summary.priorities);
}

export function hasSummaryDetails(summary: ConsultationSummary): boolean {
  return Boolean(
    formatBudgetLabel(summary) ||
      summary.category ||
      summary.usage ||
      summary.stylePreference ||
      summaryPriorityLabels(summary).length > 0 ||
      summary.direction,
  );
}
