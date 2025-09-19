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
import { ProductDetailsView } from '@/components/products/ProductDetailsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, Archive, DollarSign } from 'lucide-react';


const SummaryCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="bg-slate-200 p-3 rounded-full">
            <Icon className="h-6 w-6 text-slate-600" />
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);


export function ProductsClientPage() {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [hideZeroStock, setHideZeroStock] = useState(false);


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
    drawer.openDrawer({
        title: 'Edit Product Batch',
        description: `Editing details for ${batch.product.name} - Batch ${batch.batchNumber}`,
        content: <AddProductForm productBatch={batch} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-4xl'
    });
  }, [drawer, handleFormSuccess]);

  const openViewDetailsDrawer = useCallback((batch: ProductBatch) => {
    drawer.openDrawer({
      title: `Details for ${batch.product.name}`,
      description: `Batch: ${batch.batchNumber}`,
      content: <ProductDetailsView batch={batch} />,
      drawerClassName: 'sm:max-w-2xl'
    });
  }, [drawer]);

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
        toast({ 
            variant: "destructive", 
            title: "Deletion Failed", 
            description: result.error // Display the specific error message from the server
        });
    }

    setIsDeleteDialogOpen(false);
    setBatchToDelete(null);
  };
  
  const filteredBatches = useMemo(() => {
      if (hideZeroStock) {
        return batches.filter(batch => batch.stock > 0);
      }
      return batches;
  }, [batches, hideZeroStock]);


  const summary = useMemo(() => {
    const totalBatches = batches.length;
    const totalMasterProducts = new Set(batches.map(b => b.productId)).size;
    const totalStockQuantity = batches.reduce((sum, b) => sum + b.stock, 0);
    const totalStockValue = batches.reduce((sum, b) => sum + (b.stock * (b.costPrice ?? 0)), 0);

    return {
        totalBatches,
        totalMasterProducts,
        totalStockQuantity,
        totalStockValue
    };
  }, [batches]);


  const columns = useMemo(() => getColumns(openEditBatchDrawer, handleDeleteRequest, openViewDetailsDrawer), [openEditBatchDrawer, openViewDetailsDrawer]);

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
        data={filteredBatches}
        onAddProduct={openAddProductDrawer}
        hideZeroStock={hideZeroStock}
        onHideZeroStockChange={setHideZeroStock}
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

        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>An overview of your current stock levels and value.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="Master Products" value={summary.totalMasterProducts} icon={Package} />
                <SummaryCard title="Total Batches" value={summary.totalBatches} icon={Warehouse} />
                <SummaryCard title="Total Stock Units" value={summary.totalStockQuantity.toLocaleString()} icon={Archive} />
                <SummaryCard title="Total Stock Value" value={`Rs. ${summary.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
            </CardContent>
        </Card>
    </>
  );
}
