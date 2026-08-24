import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

import { GarageNav } from "@/components/GarageNav";
import { isProductImportAdminEmail } from "@/lib/product/import/product-import-auth";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "登録済み商品 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
    if (!isProductImportAdminEmail(context.user.email)) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-semibold">登録済み商品</h1>
        <p className="mt-2 text-sm text-muted-foreground">商品一覧は準備中です。</p>
      </main>
    </div>
  );
}
