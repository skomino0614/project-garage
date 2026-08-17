export type ConsultSearch = {
  maker?: string;
  model?: string;
  series?: string;
};

export function formatVehicleLabel(maker: string, model: string, series: string): string {
  return `${maker} ${model} ${series}`;
}

/** Category chip prompts use a natural Japanese vehicle reference. */
export function vehiclePromptRef(maker: string, model: string, series: string): string {
  const seriesNum = series.replace(/\s*series/i, "").trim();
  if (/^\d+$/.test(seriesNum)) {
    return `${seriesNum}系${model}`;
  }
  return formatVehicleLabel(maker, model, series);
}

const CATEGORY_SUFFIX: Record<string, string> = {
  ドラレコ: "におすすめのドラレコを教えて",
  ホイール: "におすすめのホイールを教えて",
  タイヤ: "におすすめのタイヤを教えて",
  車高調: "におすすめの車高調を教えて",
  コーティング: "におすすめのコーティングを教えて",
  リセール: "のリセールを意識したカスタムについて教えて",
};

export function categoryPrompt(category: string, maker: string, model: string, series: string): string {
  const ref = vehiclePromptRef(maker, model, series);
  const suffix = CATEGORY_SUFFIX[category];
  if (!suffix) {
    return `${ref}について${category}の相談をしたい`;
  }
  return `${ref}${suffix}`;
}

export function generateMockConsultReply(
  question: string,
  maker: string,
  model: string,
  series: string,
): string {
  const vehicle = formatVehicleLabel(maker, model, series);
  const q = question.trim();

  if (/ホイール|wheel/i.test(q)) {
    if (/20万|20 万|200000|20万円/i.test(q)) {
      return `${vehicle}なら、20万円以内を目安にする場合、まずはインチ数とオフセット、タイヤサイズとのバランスを決めるのが近道です。見た目・乗り心地・リセールのどれを優先するかで、選ぶ方向性が変わります。`;
    }
    return `${vehicle}向けのホイール選びでは、見た目・乗り心地・リセールの優先順位を決めると候補を絞りやすくなります。予算感が決まっていれば、その範囲で無理のないサイズ設定から検討するのがおすすめです。`;
  }

  if (/ドラレコ|ドライブレコーダー/i.test(q)) {
    return `${vehicle}でのドラレコ選びでは、前後カメラの要否、夜間の視認性、駐車監視の必要性あたりを先に決めるとよいです。配線や取り付け位置は車種によって向き不向きがあるため、設置イメージが合うかも合わせて確認すると安心です。`;
  }

  if (/タイヤ|tire/i.test(q)) {
    return `${vehicle}のタイヤは、普段の使用環境（乾燥・多雨・雪道）と、静粛性・耐磨耗・グリップのどれを優先するかで選び方が変わります。サイズを変えない範囲で候補を絞るのが、初期検討では扱いやすいです。`;
  }

  if (/車高調|ローダウン|ダウン/i.test(q)) {
    if (/乗り心地|快適/i.test(q)) {
      return `${vehicle}で乗り心地を大きく落とさず仕上げるなら、下げ幅を控えめにする、バネレートやダンパー設定を用途に合わせる、タイヤの空気圧も見直す、といった順で検討するのが現実的です。`;
    }
    return `${vehicle}の車高調は、下げ幅だけでなく、使用用途（通勤・ファミリー・週末走行）とセットで考えるのが大切です。乗り心地と車体への負担のバランスを優先するか、見た目を優先するかで方向性が変わります。`;
  }

  if (/コーティング|コート/i.test(q)) {
    return `${vehicle}のコーティングは、屋外保管か屋内保管か、洗車頻度、メンテナンスの手間をどこまで許容できるかで選び方が変わります。まずはボディ状態と保管環境を整理すると、無理のないプランが見えやすくなります。`;
  }

  if (/リセール|売却|下取/i.test(q)) {
    return `${vehicle}でリセールを意識するなら、過度なカスタムより、純正に近い仕上がりと状態の良さを優先する考え方が一般的です。変更は取り外ししやすい範囲に留めると、後からの選択肢も広がりやすくなります。`;
  }

  if (/純正|OEM|ノーマル/i.test(q)) {
    return `${vehicle}を純正っぽく仕上げるなら、色や素材を車体・内装のトーンに合わせ、主張しすぎないパーツ選びが近道です。小さな統一感（アクセントカラーや質感）を揃えるだけでも、全体の完成度は上がりやすいです。`;
  }

  if (/予算|万円|円/i.test(q)) {
    return `${vehicle}についてのご質問ですね。予算の範囲が決まっている場合は、優先したい体験（見た目・快適・安全・維持費）を一つ決めると、検討すべきカテゴリーが整理しやすくなります。`;
  }

  return `${vehicle}についてのご質問ですね。用途や予算、優先したいポイント（見た目・乗り心地・リセールなど）が決まっていれば、より具体的な選び方をご案内できます。`;
}
