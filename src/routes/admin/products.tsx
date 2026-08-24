import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { GarageNav } from "@/components/GarageNav";
import { isProductImportAdminEmail } from "@/lib/product/import/product-import-auth";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "登録済み商品 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" });
    if (!isProductImportAdminEmail(context.user.email)) throw redirect({ to: "/" });
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-2xl font-semibold">登録済み商品</h1>
        <p className="mt-2 text-sm text-muted-foreground">商品一覧のルートを復旧しました。</p>
        <Link to="/admin/product-import" className="mt-6 inline-block text-sm text-primary hover:underline">← 商品登録へ戻る</Link>
      </main>
    </div>
  );
}
