const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
};

/** Decode common HTML entities emitted by structured AI output into plain text. */
export function decodeHtmlEntities(text: string): string {
  let result = text;
  let previous = "";

  // Repeat for nested entities such as &amp;quot;
  while (result !== previous) {
    previous = result;
    result = result.replace(
      /&(#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z]+));/g,
      (match, _full, hexCode, decCode, namedEntity) => {
        if (hexCode) {
          const codePoint = Number.parseInt(hexCode, 16);
          return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }

        if (decCode) {
          const codePoint = Number.parseInt(decCode, 10);
          return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }

        if (namedEntity) {
          const decoded = NAMED_HTML_ENTITIES[namedEntity.toLowerCase()];
          return decoded ?? match;
        }

        return match;
      },
    );
  }

  return result;
}

/** Strip Markdown markers so AI replies render cleanly as plain text. */
export function formatConsultContent(text: string): string {
  let result = decodeHtmlEntities(text);

  // Fenced code blocks → inner text only
  result = result.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim(),
  );

  // Inline code
  result = result.replace(/`([^`]+)`/g, "$1");

  // Bold / italic
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/\*([^*]+)\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");
  result = result.replace(/_([^_]+)_/g, "$1");

  // Headings
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Bullet lists: "- item" or "* item" → "・item"
  result = result.replace(/^[\t ]*[-*+]\s+/gm, "・");

  // Ordered lists: "1. item" → "1. item" (keep number, remove extra markdown)
  result = result.replace(/^[\t ]*(\d+)\.\s+/gm, "$1. ");

  // Links: [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  return result.trim();
}
