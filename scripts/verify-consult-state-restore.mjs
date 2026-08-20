import { chromium } from "playwright";

const BASE = process.env.CONSULT_BASE_URL ?? "http://localhost:3000";
const CONSULT_URL = `${BASE}/consult?maker=Toyota&model=Voxy&series=90%20Series`;
const OTHER_VEHICLE_URL = `${BASE}/consult?maker=Honda&model=Stepwgn&series=6th%20Gen`;
const STORAGE_KEY = "garage:consult-state";

const LABELS = [
  "image",
  "product-name",
  "price",
  "match-score",
  "recommendation-reason",
  "card-bottom",
];

async function loadCards(page) {
  await page.goto(CONSULT_URL, { waitUntil: "networkidle", timeout: 120000 });
  await page.locator("textarea").fill("20万円以内でおすすめのホイールは？");
  await page.getByRole("button", { name: "送信" }).click();
  await page
    .locator('[aria-labelledby="product-recommendations-title"] a[href^="/products/"]')
    .first()
    .waitFor({ timeout: 120000 });
  await page.waitForTimeout(3000);
}

async function getMessagesVisibility(page) {
  return page.evaluate(() => {
    const block = document.querySelector('[data-testid="consult-messages"]');
    if (!block) return { found: false, visible: false, display: null, bubbleCount: 0 };
    const style = getComputedStyle(block);
    return {
      found: true,
      visible: style.display !== "none" && style.visibility !== "hidden",
      display: style.display,
      bubbleCount: block.querySelectorAll(".rounded-2xl").length,
    };
  });
}

async function getConsultSnapshot(page) {
  return page.evaluate(() => {
    const messages = [...document.querySelectorAll('[data-testid="consult-messages"] .rounded-2xl')].map(
      (el) => el.textContent?.slice(0, 80) ?? "",
    );
    const cards = document.querySelectorAll(
      '[aria-labelledby="product-recommendations-title"] a[href^="/products/"]',
    ).length;
    const titleVisible = Boolean(
      document.querySelector("#product-recommendations-title")?.checkVisibility?.() ??
        document.querySelector("#product-recommendations-title"),
    );
    return { messages, cards, titleVisible };
  });
}

async function getStoredState(page) {
  return page.evaluate((key) => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return { corrupt: true };
    }
  }, STORAGE_KEY);
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
  await chipBtn.click();
  const chipWorks = (await page.locator("textarea").inputValue()).includes("タイヤ");

  await page.locator("textarea").fill("テスト入力");
  const textareaWorks = (await page.locator("textarea").inputValue()) === "テスト入力";

  await page.locator("textarea").fill("追加質問");
  await page.getByRole("button", { name: "送信" }).click();
  await page.waitForTimeout(2500);
  const sendWorks = (await page.locator("textarea").inputValue()) === "";

  return { chipWorks, textareaWorks, sendWorks };
}

async function testBackRestore(page) {
  await loadCards(page);
  const before = await getConsultSnapshot(page);
  const storedBefore = await getStoredState(page);

  const cardHref = await page
    .locator('[aria-labelledby="product-recommendations-title"] a[href^="/products/"]')
    .first()
    .getAttribute("href");
  await page.locator(`a[href="${cardHref}"]`).first().click();
  await page.waitForURL(/\/products\//, { timeout: 30000 });
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const after = await getConsultSnapshot(page);
  return {
    before,
    after,
    storedBefore,
    restored:
      after.cards > 0 &&
      after.messages.length >= before.messages.length &&
      after.messages.some((m) => m.includes("ホイール")),
  };
}

async function testReloadRestore(page) {
  await loadCards(page);
  const before = await getConsultSnapshot(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const after = await getConsultSnapshot(page);
  return {
    before,
    after,
    restored: after.cards > 0 && after.messages.length >= before.messages.length,
  };
}

async function testVehicleSwitch(page) {
  await loadCards(page);
  const voxySnapshot = await getConsultSnapshot(page);
  await page.goto(OTHER_VEHICLE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const otherSnapshot = await getConsultSnapshot(page);
  const stored = await getStoredState(page);
  return {
    voxySnapshot,
    otherSnapshot,
    storedVehicle: stored?.vehicle ?? null,
    noCrossRestore:
      otherSnapshot.cards === 0 &&
      otherSnapshot.messages.length <= 1 &&
      stored?.vehicle?.maker === "Toyota",
  };
}

async function testCorruptStorage(page) {
  await page.goto(CONSULT_URL, { waitUntil: "networkidle" });
  await page.evaluate((key) => sessionStorage.setItem(key, "{bad-json"), STORAGE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const snapshot = await getConsultSnapshot(page);
  return {
    safeFallback: snapshot.messages.length === 1 && snapshot.cards === 0,
    snapshot,
  };
}

async function runViewport(viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });

  const consultPage = await context.newPage();
  await loadCards(consultPage);
  const messagesVisibility = await getMessagesVisibility(consultPage);
  await consultPage.close();

  const cardResults = [];
  for (const label of LABELS) {
    const page = await context.newPage();
    await loadCards(page);
    cardResults.push(await clickPoint(page, label));
    await page.close();
  }

  const footerPage = await context.newPage();
  const footer = await testFooter(footerPage);
  await footerPage.close();

  const backPage = await context.newPage();
  const backRestore = await testBackRestore(backPage);
  await backPage.close();

  const reloadPage = await context.newPage();
  const reloadRestore = await testReloadRestore(reloadPage);
  await reloadPage.close();

  const vehiclePage = await context.newPage();
  const vehicleSwitch = await testVehicleSwitch(vehiclePage);
  await vehiclePage.close();

  const corruptPage = await context.newPage();
  const corruptStorage = await testCorruptStorage(corruptPage);
  await corruptPage.close();

  await browser.close();

  const cardPass = cardResults.every((r) => r.navigated);
  const footerPass = footer.chipWorks && footer.textareaWorks && footer.sendWorks;

  return {
    viewport,
    messagesVisibility,
    cardClicks: cardResults,
    footer,
    backRestore,
    reloadRestore,
    vehicleSwitch,
    corruptStorage,
    passed:
      messagesVisibility.visible &&
      cardPass &&
      footerPass &&
      backRestore.restored &&
      reloadRestore.restored &&
      vehicleSwitch.noCrossRestore &&
      corruptStorage.safeFallback,
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
