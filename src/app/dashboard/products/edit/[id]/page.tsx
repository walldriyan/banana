// src/app/dashboard/products/edit/[id]/page.tsx
import { getProductByIdAction } from "@/lib/actions/product.actions";
import { AddProductForm } from "@/components/products/AddProductForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const result = await getProductByIdAction(id);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{result.error || "Product not found."}</p>
        <Link href="/dashboard/products">
          <Button variant="link">Back to products</Button>
        </Link>
      </div>
    );
  }

  const product = result.data;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/products" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit Product
            </h1>
            <p className="text-sm text-muted-foreground">
              Modify the details for {product.name}.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Update the necessary details for the product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddProductForm product={product} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
