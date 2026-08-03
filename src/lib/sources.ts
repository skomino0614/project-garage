import type { AnswerResult } from "./answer.functions";

/** 情報ソースの識別子。将来ソースを追加する場合はここに足す。 */
export type SourceId = "maker_official" | "youtube_reviews" | "ec_listings" | "owner_reviews";

export type SourceStatus = "ready" | "planned";

export type SourceCard = {
  id: SourceId;
  label: string;
  /** 取得できた要約。未取得の場合は空文字。 */
  content: string;
  status: SourceStatus;
  /** 未取得時に表示する文言 */
  placeholder: string;
};

type SourceDef = {
  id: SourceId;
  label: string;
  placeholder: string;
  /** AI回答から該当ソースの内容を取り出す。将来は実データ取得に差し替える。 */
  extract: (answer: AnswerResult) => string;
};

export const SOURCE_DEFS: SourceDef[] = [
  {
    id: "maker_official",
    label: "メーカー公式",
    placeholder: "（取得予定）",
    extract: (a) => a.evidence?.maker_official ?? "",
  },
  {
    id: "youtube_reviews",
    label: "YouTubeレビュー",
    placeholder: "（取得予定）",
    extract: (a) => a.evidence?.youtube_reviews ?? "",
  },
  {
    id: "ec_listings",
    label: "ECサイト",
    placeholder: "（取得予定）",
    extract: () => "",
  },
  {
    id: "owner_reviews",
    label: "オーナーレビュー",
    placeholder: "（取得予定）",
    extract: (a) => a.evidence?.owner_reviews ?? "",
  },
];

export function buildSourceCards(answer: AnswerResult): SourceCard[] {
  return SOURCE_DEFS.map((def) => {
    const content = def.extract(answer)?.trim() ?? "";
    return {
      id: def.id,
      label: def.label,
      content,
      status: content ? "ready" : "planned",
      placeholder: def.placeholder,
    };
  });
}
