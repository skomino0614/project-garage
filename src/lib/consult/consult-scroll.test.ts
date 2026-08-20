import { describe, expect, it } from "vitest";

import { computeScrollTopForProductCard } from "./consult-scroll";

function mockScrollLayout(options: {
  scrollTop: number;
  clientHeight: number;
  cardTop: number;
  cardHeight: number;
}) {
  const scrollRect = { top: 100, bottom: 100 + options.clientHeight };
  const cardRect = {
    top: options.cardTop,
    bottom: options.cardTop + options.cardHeight,
    height: options.cardHeight,
  };

  const scrollEl = {
    clientHeight: options.clientHeight,
    scrollTop: options.scrollTop,
    getBoundingClientRect: () => scrollRect,
  } as unknown as HTMLElement;

  const cardEl = {
    getBoundingClientRect: () => cardRect,
  } as unknown as HTMLElement;

  return { scrollEl, cardEl };
}

describe("computeScrollTopForProductCard", () => {
  it("scrolls to card top when the card fits in the viewport", () => {
    const { scrollEl, cardEl } = mockScrollLayout({
      scrollTop: 0,
      clientHeight: 600,
      cardTop: 700,
      cardHeight: 400,
    });

    expect(computeScrollTopForProductCard(scrollEl, cardEl, 16)).toBe(584);
  });

  it("aligns card bottom when the card is taller than the viewport", () => {
    const { scrollEl, cardEl } = mockScrollLayout({
      scrollTop: 0,
      clientHeight: 400,
      cardTop: 500,
      cardHeight: 520,
    });

    expect(computeScrollTopForProductCard(scrollEl, cardEl, 16)).toBe(536);
  });

  it("never returns a negative scroll position", () => {
    const { scrollEl, cardEl } = mockScrollLayout({
      scrollTop: 0,
      clientHeight: 600,
      cardTop: 110,
      cardHeight: 200,
    });

    expect(computeScrollTopForProductCard(scrollEl, cardEl, 16)).toBe(0);
  });
});
