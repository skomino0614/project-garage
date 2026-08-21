import { describe, expect, it } from "vitest";

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

const sampleState: StoredConsultState = {
  version: 1,
  vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
  messages: [
    { id: "welcome", role: "assistant", content: "この車について、何でも相談してください。" },
    { id: "user-1", role: "user", content: "20万円以内でおすすめのホイールは？" },
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
  scrollTop: 240,
};

describe("consult state storage", () => {
  it("saves and loads consult state for the same vehicle", () => {
    withMockSessionStorage(() => {
      saveConsultState("Toyota", "Voxy", "90 Series", {
        messages: sampleState.messages,
        summary: sampleState.summary,
        recommendations: sampleState.recommendations,
        scrollTop: 240,
      });

      expect(loadConsultState("Toyota", "Voxy", "90 Series")).toEqual(sampleState);
    });
  });

  it("does not restore consult state for a different vehicle", () => {
    withMockSessionStorage(() => {
      saveConsultState("Toyota", "Voxy", "90 Series", {
        messages: sampleState.messages,
        summary: sampleState.summary,
        recommendations: sampleState.recommendations,
      });

      expect(loadConsultState("Honda", "Stepwgn", "6th Gen")).toBeNull();
    });
  });

  it("returns null for corrupted sessionStorage data", () => {
    withMockSessionStorage((storage) => {
      storage.set(CONSULT_STATE_STORAGE_KEY, "{not-json");
      expect(loadConsultState("Toyota", "Voxy", "90 Series")).toBeNull();
    });
  });

  it("returns null for invalid stored schema", () => {
    withMockSessionStorage((storage) => {
      storage.set(CONSULT_STATE_STORAGE_KEY, JSON.stringify({ version: 99, vehicle: {} }));
      expect(loadConsultState("Toyota", "Voxy", "90 Series")).toBeNull();
    });
  });

  it("clears stored consult state", () => {
    withMockSessionStorage((storage) => {
      saveConsultState("Toyota", "Voxy", "90 Series", {
        messages: sampleState.messages,
        summary: sampleState.summary,
        recommendations: sampleState.recommendations,
      });
      clearConsultState();
      expect(storage.has(CONSULT_STATE_STORAGE_KEY)).toBe(false);
    });
  });
});
