import { chromium } from "playwright";

const BASE = process.env.CONSULT_BASE_URL ?? "http://localhost:3000";
const URL = `${BASE}/consult?maker=Toyota&model=Voxy&series=90%20Series`;

const LABELS = [
  "image",
  "product-name",
  "price",
  "match-score",
  "recommendation-reason",
  "card-bottom",
];

async function loadCards(page) {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 120000 });
  await page.locator("textarea").fill("20万円以内でおすすめのホイールは？");
  await page.getByRole("button", { name: "送信" }).click();
  await page
    .locator('[aria-labelledby="product-recommendations-title"] a[href^="/products/"]')
    .first()
    .waitFor({ timeout: 120000 });
  await page.waitForTimeout(4000);
}

async function captureLayout(page) {
  return page.evaluate(() => {
    const root = document.querySelector(".flex.h-\\[100dvh\\]");
    const main = document.querySelector("main");
    const scroll = document.querySelector(".overflow-y-auto.overscroll-contain");
    const footer = document.querySelector(".shrink-0.border-t.border-border\\/60");
    const section = document.querySelector('[aria-labelledby="product-recommendations-title"]');
    const card = document.querySelector(
      '[aria-labelledby="product-recommendations-title"] a[href^="/products/"]',
    );
    const rect = (el) => (el ? el.getBoundingClientRect().toJSON() : null);
    return {
      viewport: { w: innerWidth, h: innerHeight },
      root: rect(root),
      main: rect(main),
      scrollContainer: scroll
        ? {
            rect: rect(scroll),
            clientHeight: scroll.clientHeight,
            scrollTop: scroll.scrollTop,
          }
        : null,
      footer: rect(footer),
      recommendationSection: rect(section),
      productCard: card
        ? { rect: rect(card), href: card.getAttribute("href") }
        : null,
      cardFitsInScroll:
        card && scroll
          ? card.getBoundingClientRect().bottom <= scroll.getBoundingClientRect().bottom + 1
          : null,
      scrollAboveFooter:
        scroll && footer
          ? scroll.getBoundingClientRect().bottom <= footer.getBoundingClientRect().top + 1
          : null,
    };
  });
}

async function getPoint(page, label) {
  return page.evaluate((lbl) => {
    const anchor = document.querySelector(
      '[aria-labelledby="product-recommendations-title"] a[href^="/products/"]',
    );
    const image = anchor.querySelector("div[aria-hidden='true'], .aspect-\\[4\\/3\\]");
    const name = anchor.querySelector("h3");
    const price = [...anchor.querySelectorAll("p")].find((p) =>
      p.className.includes("font-medium text-foreground/90"),
    );
    const match = [...anchor.querySelectorAll("p")].find((p) =>
      p.className.includes("text-xs text-muted-foreground"),
    );
    const reason = [...anchor.querySelectorAll("p")].find(
      (p) =>
        p.className.includes("text-foreground/90") &&
        p.textContent &&
        p.textContent.length > 20,
    );
    const bottom = anchor.querySelector(".mt-auto.pt-1");
    const map = {
      image: image ?? anchor,
      "product-name": name ?? anchor,
      price: price ?? anchor,
      "match-score": match ?? anchor,
      "recommendation-reason": reason ?? anchor,
      "card-bottom": bottom ?? anchor,
    };
    const el = map[lbl];
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      label: lbl,
      x,
      y,
      elementFromPoint: hit
        ? { tag: hit.tagName, class: hit.className?.toString?.()?.slice(0, 60) }
        : null,
      closestA: hit?.closest?.('a[href^="/products/"]')?.getAttribute?.("href") ?? null,
    };
  }, label);
}

async function scrollPointIntoScrollContainer(page, x, y) {
  await page.evaluate(({ px, py }) => {
    const scroll = document.querySelector(".overflow-y-auto.overscroll-contain");
    if (!scroll) return;
    const rect = scroll.getBoundingClientRect();
    const margin = 24;
    if (py < rect.top + margin) {
      scroll.scrollTop -= rect.top + margin - py;
    } else if (py > rect.bottom - margin) {
      scroll.scrollTop += py - (rect.bottom - margin);
    }
  }, { px: x, py: y });
  await page.waitForTimeout(200);
}

async function clickPoint(page, label) {
  let probe = await getPoint(page, label);
  await scrollPointIntoScrollContainer(page, probe.x, probe.y);
  probe = await getPoint(page, label);
  const before = page.url();
  await page.mouse.click(probe.x, probe.y);
  await page.waitForTimeout(2000);
  const after = page.url();
  return {
    ...probe,
    navigated: before !== after && /\/products\//.test(after),
    afterUrl: after,
  };
}

async function testFooter(page) {
  await loadCards(page);

  const chipBtn = page.getByRole("button", { name: "タイヤ" });
  const chipRect = await chipBtn.boundingBox();
  await chipBtn.click();
  const chipProbe = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return {
      elementFromPoint: hit?.tagName,
      value: document.querySelector("textarea")?.value ?? "",
    };
  }, { x: chipRect.x + chipRect.width / 2, y: chipRect.y + chipRect.height / 2 });
  const chipWorks = chipProbe.value.includes("タイヤ");

  await page.locator("textarea").fill("テスト入力");
  const taBox = await page.locator("textarea").boundingBox();
  const textareaProbe = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return {
      elementFromPoint: hit?.tagName,
      value: document.querySelector("textarea")?.value ?? "",
    };
  }, { x: taBox.x + taBox.width / 2, y: taBox.y + taBox.height / 2 });
  const textareaWorks = textareaProbe.value === "テスト入力";

  await page.locator("textarea").fill("追加質問");
  const sendBtn = page.getByRole("button", { name: "送信" });
  const sendBox = await sendBtn.boundingBox();
  await sendBtn.click();
  await page.waitForTimeout(2500);
  const sendProbe = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return {
      elementFromPoint: hit?.tagName,
      value: document.querySelector("textarea")?.value ?? "",
    };
  }, { x: sendBox.x + sendBox.width / 2, y: sendBox.y + sendBox.height / 2 });
  const sendWorks = sendProbe.value === "";

  return {
    chip: { works: chipWorks, ...chipProbe },
    textarea: { works: textareaWorks, ...textareaProbe },
    send: { works: sendWorks, ...sendProbe },
  };
}

async function runViewport(viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });

  const layoutPage = await context.newPage();
  await loadCards(layoutPage);
  const layout = await captureLayout(layoutPage);
  await layoutPage.close();

  const results = [];
  for (const label of LABELS) {
    const page = await context.newPage();
    await loadCards(page);
    results.push(await clickPoint(page, label));
    await page.close();
  }

  const footerPage = await context.newPage();
  const footer = await testFooter(footerPage);
  await footerPage.close();
  await browser.close();

  const cardPass = results.every((r) => r.navigated);
  const footerPass = footer.chip.works && footer.textarea.works && footer.send.works;

  return {
    viewport,
    layout,
    cardClicks: results,
    footer,
    passed: cardPass && footerPass,
  };
}

async function main() {
  const report = { baseUrl: BASE, runs: [] };
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 430, height: 932 },
  ]) {
    report.runs.push(await runViewport(viewport));
  }
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.runs.every((r) => r.passed) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
