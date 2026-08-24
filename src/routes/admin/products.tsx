import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import {
  getAdminProducts,
  type AdminProductSummary,
} from "@/lib/product/admin-product-compatibility.functions";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "登録済み商品 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const getProductsFn = useServerFn(getAdminProducts);
  const [products, setProducts] = useState<AdminProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getProductsFn({ data: {} })
      .then((result) => {
        if (!active) return;
        setProducts(result);
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        setErrorMsg(error instanceof Error ? error.message : "商品一覧の取得に失敗しました。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [getProductsFn]);

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">登録済み商品</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              登録済みの商品を確認し、商品ごとの適合車種登録へ進めます。
            </p>
          </div>
          <Link
            to="/admin/product-import"
            className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary"
          >
            ＋ 商品を登録
          </Link>
        </div>

        {errorMsg ? <p className="mt-6 text-sm text-destructive">{errorMsg}</p> : null}
        {loading ? <p className="mt-6 text-sm text-muted-foreground">読み込み中…</p> : null}

        {!loading && !errorMsg && products.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-border/80 bg-card/40 p-6 text-sm text-muted-foreground">
            登録済みの商品はありません。
          </section>
        ) : null}

        {!loading && !errorMsg && products.length > 0 ? (
          <section className="mt-6 space-y-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/40 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-background">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="px-2 text-center text-xs text-muted-foreground">画像なし</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{product.name}</h2>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {product.category}
                    </span>
                    {product.isDemo ? (
                      <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-300">
                        DEMO
                      </span>
                    ) : null}
                    {!product.isActive ? (
                      <span className="rounded-full border border-destructive/40 px-2 py-0.5 text-xs text-destructive">
                        非公開
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.brand} / ¥{product.priceMinYen.toLocaleString()}〜¥{product.priceMaxYen.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    登録日：{new Date(product.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    to="/admin/product-compatibility/$productId"
                    params={{ productId: product.id }}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    適合車種を登録
                  </Link>
                  {product.productUrl ? (
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
                    >
                      商品ページ ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
