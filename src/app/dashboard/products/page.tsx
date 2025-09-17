// src/app/dashboard/products/page.tsx
import { getProductsAction } from "@/lib/actions/product.actions";
import { ProductsDataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";


async function getProducts() {
  const result = await getProductsAction();
  if (result.success && result.data) {
    return result.data;
  }
  // In case of an error, you might want to log it and return an empty array
  console.error("Failed to fetch products for dashboard:", result.error);
  return [];
}


export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">View, add, edit, and manage all your products.</p>
        </div>
        <AuthorizationGuard permissionKey="products.create">
          <Link href="/products/add" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </AuthorizationGuard>
      </div>
      <ProductsDataTable columns={columns} data={products} />
    </div>
  );
}
