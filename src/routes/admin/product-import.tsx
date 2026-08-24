import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import { PRODUCT_CATEGORIES } from "@/lib/product/constants";
import {
  fetchProductImportCandidate,
  refreshRealProductImages,
  registerProductImportCandidate,
} from "@/lib/product/import/product-import-candidate.functions";
import type { ProductImportCandidate } from "@/lib/product/import/build-candidate";
import { isProductImportAdminEmail } from "@/lib/product/import/product-import-auth";

export const Route = createFileRoute("/admin/product-import")({
  head: () => ({ meta: [{ title: "商品登録候補 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }

    if (!isProductImportAdminEmail(context.user.email)) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminProductImportPage,
});

function AdminProductImportPage() {
  const fetchCandidateFn = useServerFn(fetchProductImportCandidate);
  const refreshImagesFn = useServerFn(refreshRealProductImages);
  const registerCandidateFn = useServerFn(registerProductImportCandidate);

  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0] ?? "ホイール");
  const [candidate, setCandidate] = useState<ProductImportCandidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingImages, setRefreshingImages] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredProductId, setRegisteredProductId] = useState<string | null>(null);
  const [imageRefreshResult, setImageRefreshResult] = useState<{
    totalCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
  } | null>(null);

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

  const handleRefreshImages = async () => {
    setRefreshingImages(true);
    setErrorMsg(null);
    setImageRefreshResult(null);

    try {
      const result = await refreshImagesFn({ data: {} });
      setImageRefreshResult(result);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "商品画像の更新に失敗しました。");
    } finally {
      setRefreshingImages(false);
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">商品登録候補（開発用）</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              WEBページURLから商品情報を抽出し、確認後に products へ登録します。
            </p>
          </div>
          <Link
            to="/admin/product-compatibility"
            className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            登録済み商品一覧 →
          </Link>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-border/80 bg-card/50 p-4">
          <div className="space-y-3">
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

          <div className="border-t border-border/70 pt-4">
            <p className="text-sm font-medium">既存の実商品</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              image_url が未設定の実商品だけを公式商品ページから再取得します。AIは使わず、商品ページの画像抽出だけを行います。
            </p>
            <button
              type="button"
              onClick={handleRefreshImages}
              disabled={refreshingImages}
              className="mt-3 rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
            >
              {refreshingImages ? "画像を再取得中…" : "実商品の画像を一括更新"}
            </button>
            {imageRefreshResult ? (
              <p className="mt-3 text-xs text-muted-foreground">
                対象 {imageRefreshResult.totalCount}件 / 更新 {imageRefreshResult.updatedCount}件 / 未取得 {imageRefreshResult.skippedCount}件 / エラー {imageRefreshResult.failedCount}件
              </p>
            ) : null}
          </div>
        </div>

        {errorMsg ? <p className="mt-4 text-sm text-destructive">{errorMsg}</p> : null}
        {registeredProductId ? (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-primary">商品登録が完了しました。</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">Product ID: {registeredProductId}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/admin/product-compatibility/$productId"
                params={{ productId: registeredProductId }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                適合車種を登録する →
              </Link>
              <Link
                to="/admin/product-compatibility"
                className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary"
              >
                登録済み商品一覧 →
              </Link>
            </div>
          </div>
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
