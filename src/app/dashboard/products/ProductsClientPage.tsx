// src/app/dashboard/products/ProductsClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '@/types';
import { getProductsAction, deleteProductAction } from '@/lib/actions/product.actions';
import { ProductsDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddProductForm } from '@/components/products/AddProductForm';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProductsClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const result = await getProductsAction();
    if (result.success && result.data) {
      setProducts(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching products',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchProducts(); // Refresh the product list
  };

  const openAddProductDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Product',
      description: 'Fill in the details below to add a new product.',
      content: <AddProductForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-4xl'
    });
  };

  const openEditProductDrawer = useCallback((product: Product) => {
    // No need for async/await here, we already have the product object
    drawer.openDrawer({
        title: 'Edit Product',
        description: `Editing details for ${product.name}`,
        content: <AddProductForm product={product} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-4xl'
    });
  }, [drawer, handleFormSuccess]);

  const handleDeleteRequest = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    const result = await deleteProductAction(productToDelete);

    if (result.success) {
        toast({ title: "Product Deleted", description: `Product has been deleted.` });
        fetchProducts(); // Refresh list
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditProductDrawer, handleDeleteRequest), [openEditProductDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <ProductsDataTable
        columns={columns}
        data={products}
        onAddProduct={openAddProductDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteProduct} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
