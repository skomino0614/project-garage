/** Strip Markdown markers so AI replies render cleanly as plain text. */
export function formatConsultContent(text: string): string {
  let result = text;

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
