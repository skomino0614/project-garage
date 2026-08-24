import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import { getAdminProducts } from "@/lib/product/admin-products.functions";
import { isProductImportAdminEmail } from "@/lib/product/import/product-import-auth";

type Product = { id: string; name: string; brand: string; category: string };

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "登録済み商品 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" });
    if (!isProductImportAdminEmail(context.user.email)) throw redirect({ to: "/" });
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const getProducts = useServerFn(getAdminProducts);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getProducts({ data: {} }).then(setProducts).catch((e) => setError(e instanceof Error ? e.message : "商品一覧の取得に失敗しました。")).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background"><GarageNav /><main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">登録済み商品</h1><Link to="/admin/product-import" className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">＋ 商品を登録</Link></div>
      {loading ? <p className="mt-6 text-sm text-muted-foreground">読み込み中…</p> : null}
      {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}
      <div className="mt-6 space-y-3">{products.map((p) => <article key={p.id} className="rounded-xl border p-4 flex items-center justify-between"><div><h2 className="font-medium">{p.name}</h2><p className="text-sm text-muted-foreground">{p.brand} / {p.category}</p></div><Link to="/admin/product-compatibility/$productId" params={{productId:p.id}} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">適合車種を登録</Link></article>)}</div>
    </main></div>
  );
}
