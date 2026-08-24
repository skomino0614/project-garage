import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  return <div>Products</div>;
}
