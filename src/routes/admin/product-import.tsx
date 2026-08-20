import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import { PRODUCT_CATEGORIES } from "@/lib/product/constants";
import {
  fetchProductImportCandidate,
  registerProductImportCandidate,
} from "@/lib/product/import/product-import-candidate.functions";
import type { ProductImportCandidate } from "@/lib/product/import/build-candidate";

export const Route = createFileRoute("/admin/product-import")({
  head: () => ({ meta: [{ title: "商品登録候補 — Project Garage" }] }),
  component: AdminProductImportPage,
});

function AdminProductImportPage() {
  const fetchCandidateFn = useServerFn(fetchProductImportCandidate);
  const registerCandidateFn = useServerFn(registerProductImportCandidate);

  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0] ?? "ホイール");
  const [candidate, setCandidate] = useState<ProductImportCandidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredProductId, setRegisteredProductId] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setErrorMsg(null);
    setRegisteredProductId(null);

    try {
      const result = await fetchCandidateFn({ data: { url: url.trim(), useAi: true } });
      setCandidate(result);
    } catch (error) {
      console.error(error);
      setCandidate(null);
      setErrorMsg(error instanceof Error ? error.message : "商品情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!candidate) {
      return;
    }

    if (!candidate.name || !candidate.brand || !candidate.priceMinYen || !candidate.priceMaxYen) {
      setErrorMsg("name / brand / price が不足しているため登録できません。");
      return;
    }

    setRegistering(true);
    setErrorMsg(null);

    try {
      const result = await registerCandidateFn({
        data: {
          sourceUrl: candidate.sourceUrl,
          fetchedAt: candidate.fetchedAt,
          name: candidate.name,
          brand: candidate.brand,
          description: candidate.description,
          priceMinYen: candidate.priceMinYen,
          priceMaxYen: candidate.priceMaxYen,
          imageUrl: candidate.imageUrl,
          productUrl: candidate.productUrl ?? candidate.sourceUrl,
          purchaseUrl: candidate.purchaseUrl,
          category: category as (typeof PRODUCT_CATEGORIES)[number],
          appearance: candidate.appearance,
          comfort: candidate.comfort,
          practicality: candidate.practicality,
          resale: candidate.resale,
          style: candidate.style ?? "その他",
          tags: candidate.tags,
        },
      });
      setRegisteredProductId(result.productId);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "商品登録に失敗しました。");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">商品登録候補（開発用）</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          WEBページURLから商品情報を抽出し、確認後に products へ登録します。
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-border/80 bg-card/50 p-4">
          <label className="block text-sm font-medium">商品URL</label>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/products/..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={loading || !url.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "取得中…" : "情報取得"}
          </button>
        </div>

        {errorMsg ? <p className="mt-4 text-sm text-destructive">{errorMsg}</p> : null}
        {registeredProductId ? (
          <p className="mt-4 text-sm text-primary">登録完了: {registeredProductId}</p>
        ) : null}

        {candidate ? (
          <section className="mt-8 space-y-4 rounded-2xl border border-border/80 bg-card/40 p-4">
            <h2 className="text-lg font-semibold">抽出結果</h2>
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-muted-foreground">sourceUrl</dt><dd>{candidate.sourceUrl}</dd></div>
              <div><dt className="text-muted-foreground">name</dt><dd>{candidate.name ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">brand</dt><dd>{candidate.brand ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">description</dt><dd>{candidate.description ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">price</dt><dd>{candidate.priceMinYen ?? "—"} - {candidate.priceMaxYen ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">imageUrl</dt><dd>{candidate.imageUrl ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">productUrl</dt><dd>{candidate.productUrl ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">purchaseUrl</dt><dd>{candidate.purchaseUrl ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">extractionSource</dt><dd>{candidate.extractionSource}</dd></div>
            </dl>

            {candidate.warnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-amber-700 dark:text-amber-300">
                {candidate.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}

            <div>
              <label className="mb-1 block text-sm font-medium">登録カテゴリ（人手設定）</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {PRODUCT_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={registering}
              className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
            >
              {registering ? "登録中…" : "products へ登録"}
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
