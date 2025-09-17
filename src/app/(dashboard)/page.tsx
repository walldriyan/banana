// src/app/products/add/page.tsx
import { AddProductForm } from "@/components/products/AddProductForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddProductPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/products" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Add New Product
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fill in the details below to add a new product to the inventory.
            </p>
          </div>
        </div>

        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Provide all the necessary details for the new product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddProductForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}