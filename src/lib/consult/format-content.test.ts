import { describe, expect, it } from "vitest";

import { decodeHtmlEntities, formatConsultContent } from "./format-content";

describe("decodeHtmlEntities", () => {
  it("decodes &quot; into a double quote", () => {
    expect(decodeHtmlEntities("&quot;コンフォートタイヤ&quot;")).toBe('"コンフォートタイヤ"');
  });

  it("decodes nested entities such as &amp;quot;", () => {
    expect(decodeHtmlEntities("&amp;quot;スポーツタイヤ&amp;quot;")).toBe('"スポーツタイヤ"');
  });

  it("decodes numeric entities", () => {
    expect(decodeHtmlEntities("&#34;タイヤ&#34;")).toBe('"タイヤ"');
    expect(decodeHtmlEntities("&#x30BF;&#x30A4;&#x30E4;")).toBe("タイヤ");
  });

  it("decodes common named entities without introducing HTML rendering", () => {
    expect(decodeHtmlEntities("A &amp; B &lt;tag&gt;")).toBe('A & B <tag>');
  });

  it("leaves unknown entities unchanged", () => {
    expect(decodeHtmlEntities("&unknown;")).toBe("&unknown;");
  });
});

describe("formatConsultContent", () => {
  it("decodes HTML entities before markdown cleanup", () => {
    const input =
      "&quot;コンフォートタイヤ&quot;と&quot;スポーツタイヤ&quot;のどちらが近いですか？";
    expect(formatConsultContent(input)).toBe(
      '"コンフォートタイヤ"と"スポーツタイヤ"のどちらが近いですか？',
    );
  });

  it("handles wheel, dashcam, and tire category copy consistently", () => {
    expect(formatConsultContent("&quot;高級感寄り&quot;")).toBe('"高級感寄り"');
    expect(formatConsultContent("&quot;前後2カメラ&quot;")).toBe('"前後2カメラ"');
    expect(formatConsultContent("&quot;静音タイヤ&quot;")).toBe('"静音タイヤ"');
  });

  it("still strips markdown after decoding entities", () => {
    expect(formatConsultContent("**&quot;高級感&quot;**")).toBe('"高級感"');
    expect(formatConsultContent("[&quot;詳細&quot;](https://example.com)")).toBe('"詳細"');
  });

  it("is idempotent when applied more than once", () => {
    const once = formatConsultContent("&quot;コンフォートタイヤ&quot;");
    expect(formatConsultContent(once)).toBe(once);
  });
});
