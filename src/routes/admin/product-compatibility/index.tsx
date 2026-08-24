import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import {
  getAdminProductCompatibilityList,
  type AdminProductCompatibilityListItem,
} from "@/lib/product/admin-product-compatibility.functions";
import { isProductImportAdminEmail } from "@/lib/product/import/product-import-auth";

export const Route = createFileRoute("/admin/product-compatibility/")({
  head: () => ({ meta: [{ title: "登録済み商品 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }

    if (!isProductImportAdminEmail(context.user.email)) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminProductCompatibilityListPage,
});

function AdminProductCompatibilityListPage() {
  const getListFn = useServerFn(getAdminProductCompatibilityList);
  const [products, setProducts] = useState<AdminProductCompatibilityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getListFn({ data: undefined })
      .then((result) => {
        if (!cancelled) {
          setProducts(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setErrorMsg(error instanceof Error ? error.message : "商品一覧の取得に失敗しました。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getListFn]);

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">登録済み商品</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              本番推薦対象の実商品と、登録済みの適合情報を管理します。
            </p>
          </div>
          <Link
            to="/admin/product-import"
            className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            商品を追加する →
          </Link>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">読み込み中…</p> : null}
        {errorMsg ? <p className="text-sm text-destructive">{errorMsg}</p> : null}

        {!loading && !errorMsg && products.length === 0 ? (
          <section className="rounded-2xl border border-border/80 bg-card/40 p-6">
            <p className="text-sm text-muted-foreground">登録済みの実商品はありません。</p>
          </section>
        ) : null}

        <div className="space-y-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-border/80 bg-card/40 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {product.brand} / {product.category}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    適合情報 {product.compatibilityCount}件
                  </p>
                </div>
                <Link
                  to="/admin/product-compatibility/$productId"
                  params={{ productId: product.id }}
                  className="shrink-0 rounded-xl bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  適合情報を管理 →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
