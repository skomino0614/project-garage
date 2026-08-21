import { describe, expect, it } from "vitest";

import { handleConsultLeave } from "./handle-consult-leave";
import {
  clearConsultState,
  CONSULT_STATE_STORAGE_KEY,
  loadConsultState,
  saveConsultState,
  type StoredConsultState,
} from "./consult-state-storage";

function withMockSessionStorage(run: (storage: Map<string, string>) => void) {
  const storage = new Map<string, string>();
  const original = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      setItem: (key: string, value: string) => storage.set(key, value),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
    },
  });

  try {
    run(storage);
  } finally {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: original,
    });
  }
}

const WELCOME_ONLY: StoredConsultState["messages"] = [
  { id: "welcome", role: "assistant", content: "この車について、何でも相談してください。" },
];

const activeConsultSnapshot: StoredConsultState = {
  version: 1,
  vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
  messages: [
    ...WELCOME_ONLY,
    { id: "user-1", role: "user", content: "20万円以内でおすすめのホイールは？" },
    { id: "assistant-1", role: "assistant", content: "予算内のホイール候補を整理しました。" },
  ],
  summary: {
    vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
    budget: { maxYen: 200_000, note: null },
    category: "ホイール",
    usage: null,
    stylePreference: null,
    priorities: {
      appearance: "unknown",
      comfort: "unknown",
      practicality: "unknown",
      resale: "unknown",
    },
    direction: null,
  },
  recommendations: {
    loading: false,
    error: false,
    requestKey: "req-1",
    items: [
      {
        productId: "11111111-1111-4111-8111-111111111111",
        name: "Demo Wheel",
        brand: "Demo Brand",
        priceMinYen: 100_000,
        priceMaxYen: 120_000,
        imageUrl: null,
        productUrl: null,
        purchaseUrl: null,
        style: "高級感",
        score: 88,
        vehicleCompatibility: "confirmed",
        compatibilities: [],
        reason: "予算内でスタイルが合う候補です。",
        highlights: ["18インチ", "純正風デザイン"],
        caution: null,
      },
    ],
  },
  scrollTop: 180,
};

function persistActiveConsult() {
  saveConsultState("Toyota", "Voxy", "90 Series", {
    messages: activeConsultSnapshot.messages,
    summary: activeConsultSnapshot.summary,
    recommendations: activeConsultSnapshot.recommendations,
    scrollTop: activeConsultSnapshot.scrollTop,
  });
}

function simulateConsultLeave(toPathname: string) {
  handleConsultLeave(toPathname, persistActiveConsult);
}

function simulateConsultReturn() {
  return loadConsultState("Toyota", "Voxy", "90 Series");
}

function isWelcomeOnlyConsult(stored: StoredConsultState | null): boolean {
  return (
    stored === null ||
    (stored.messages.length === 1 &&
      stored.messages[0]?.id === "welcome" &&
      stored.summary === null &&
      stored.recommendations.items.length === 0)
  );
}

describe("consult state lifecycle", () => {
  it("1. consult → product detail → consult keeps consult history", () => {
    withMockSessionStorage(() => {
      simulateConsultLeave("/products/11111111-1111-4111-8111-111111111111");

      const restored = simulateConsultReturn();
      expect(restored).toEqual(activeConsultSnapshot);
      expect(restored?.messages.some((m) => m.content.includes("ホイール"))).toBe(true);
      expect(restored?.recommendations.items).toHaveLength(1);
      expect(restored?.scrollTop).toBe(180);
    });
  });

  it("2. consult → product detail → browser back → consult keeps consult history", () => {
    withMockSessionStorage(() => {
      simulateConsultLeave("/products/11111111-1111-4111-8111-111111111111");

      const restored = simulateConsultReturn();
      expect(restored).toEqual(activeConsultSnapshot);
      expect(restored?.messages.some((m) => m.content.includes("ホイール"))).toBe(true);
    });
  });

  it("3. consult → TOP → consult starts a fresh session", () => {
    withMockSessionStorage(() => {
      simulateConsultLeave("/");
      clearConsultState();

      expect(simulateConsultReturn()).toBeNull();
      expect(isWelcomeOnlyConsult(loadConsultState("Toyota", "Voxy", "90 Series"))).toBe(true);
    });
  });

  it("4. consult → select → consult starts a fresh session", () => {
    withMockSessionStorage(() => {
      simulateConsultLeave("/select");
      clearConsultState();

      expect(simulateConsultReturn()).toBeNull();
    });
  });

  it("5. consult → ask → consult starts a fresh session", () => {
    withMockSessionStorage(() => {
      simulateConsultLeave("/ask");
      clearConsultState();

      expect(simulateConsultReturn()).toBeNull();
    });
  });

  it("6. switching to another vehicle consult does not restore the previous session", () => {
    withMockSessionStorage((storage) => {
      persistActiveConsult();

      simulateConsultLeave("/consult");

      expect(loadConsultState("Honda", "Stepwgn", "6th Gen")).toBeNull();
      expect(storage.has(CONSULT_STATE_STORAGE_KEY)).toBe(true);

      const toyotaState = loadConsultState("Toyota", "Voxy", "90 Series");
      expect(toyotaState?.messages.some((m) => m.content.includes("ホイール"))).toBe(true);
    });
  });

  it("does not clear storage when leaving consult for product detail", () => {
    withMockSessionStorage((storage) => {
      simulateConsultLeave("/products/demo-product");

      expect(storage.has(CONSULT_STATE_STORAGE_KEY)).toBe(true);
    });
  });

  it("clears storage when leaving consult for session end routes", () => {
    withMockSessionStorage((storage) => {
      simulateConsultLeave("/");
      expect(storage.has(CONSULT_STATE_STORAGE_KEY)).toBe(false);
    });
  });
});
