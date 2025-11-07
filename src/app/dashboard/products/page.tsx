// src/app/dashboard/products/page.tsx
import { ProductsClientPage } from "./ProductsClientPage";

export default async function ProductsPage() {

  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">View, add, edit, and manage all your products.</p>
        </div>
      </div>
      <ProductsClientPage />
    </div>
  );
}
