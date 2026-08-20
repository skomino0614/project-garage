/**
 * Computes scrollTop so a product card is fully visible inside the scroll container.
 * Uses geometry only — no scrollIntoView.
 */
export function computeScrollTopForProductCard(
  scrollEl: HTMLElement,
  cardEl: HTMLElement,
  paddingPx = 16,
): number {
  const availableHeight = scrollEl.clientHeight;
  const scrollRect = scrollEl.getBoundingClientRect();
  const cardRect = cardEl.getBoundingClientRect();
  const currentScrollTop = scrollEl.scrollTop;

  const cardTopInContent = cardRect.top - scrollRect.top + currentScrollTop;
  const cardHeight = cardRect.height;

  if (cardHeight <= availableHeight - paddingPx * 2) {
    return Math.max(0, cardTopInContent - paddingPx);
  }

  return Math.max(0, cardTopInContent + cardHeight - availableHeight + paddingPx);
}

export function areMessagesVisible(messagesBlock: HTMLElement | null): boolean {
  if (!messagesBlock) {
    return false;
  }

  const style = getComputedStyle(messagesBlock);
  return style.display !== "none" && style.visibility !== "hidden";
}
