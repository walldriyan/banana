// src/app/dashboard/products/ProductsClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProductBatch } from '@/types';
import { getProductBatchesAction, deleteProductBatchAction } from '@/lib/actions/product.actions';
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
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    const result = await getProductBatchesAction();
    if (result.success && result.data) {
      setBatches(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching product batches',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchBatches(); // Refresh the batch list
  };

  const openAddProductDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Master Product',
      description: 'Define a new type of product. You can add batches later during purchase.',
      content: <AddProductForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-4xl'
    });
  };

  const openEditBatchDrawer = useCallback((batch: ProductBatch) => {
    // This is complex because AddProductForm is for master products.
    // For now, we will just log it. A dedicated BatchEditForm would be needed.
    console.log('[ProductsClientPage.tsx] Edit Batch clicked:', batch);
     toast({
        title: 'Edit Not Implemented',
        description: `Editing batches directly from this screen is not yet supported. Please manage batches via Purchases (GRN).`,
    });
    // drawer.openDrawer({
    //     title: 'Edit Product Batch',
    //     description: `Editing details for ${batch.product.name} - Batch ${batch.batchNumber}`,
    //     content: <div />, // Placeholder for a future BatchEditForm
    //     drawerClassName: 'sm:max-w-4xl'
    // });
  }, [toast]);

  const handleDeleteRequest = (batchId: string) => {
    setBatchToDelete(batchId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    const result = await deleteProductBatchAction(batchToDelete);

    if (result.success) {
        toast({ title: "Product Batch Deleted", description: `The batch has been deleted.` });
        fetchBatches(); // Refresh list
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setBatchToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditBatchDrawer, handleDeleteRequest), [openEditBatchDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <ProductsDataTable
        columns={columns}
        data={batches}
        onAddProduct={openAddProductDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product batch. 
                        This may fail if the batch is already part of a transaction.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteBatch} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
