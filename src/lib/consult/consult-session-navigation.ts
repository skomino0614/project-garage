/** Internal product detail route: /products/:productId */
export function isProductDetailPath(pathname: string): boolean {
  return /^\/products\/[^/]+\/?$/.test(pathname);
}

export function isConsultPath(pathname: string): boolean {
  return pathname === "/consult" || pathname.startsWith("/consult/");
}

/** Routes that end the consult session (TOP, vehicle select, Q&A). */
export function isConsultSessionEndPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/select" || pathname === "/ask";
}

/**
 * Whether leaving /consult should wipe persisted session state.
 * Product detail and returning to /consult are temporary departures — keep state.
 */
export function shouldClearConsultStateOnLeave(toPathname: string): boolean {
  if (isProductDetailPath(toPathname)) {
    return false;
  }
  if (isConsultPath(toPathname)) {
    return false;
  }
  return isConsultSessionEndPath(toPathname);
}
