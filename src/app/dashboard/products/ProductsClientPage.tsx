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
import { Package, Archive, DollarSign, Landmark, TrendingUp, Coins, AlertTriangle, Boxes, Wallet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';


const SummaryRow = ({ icon: Icon, label, value, description, valueClassName }: { icon: React.ElementType, label: string, value: string | number, description?: string, valueClassName?: string }) => (
    <div className="flex items-start gap-4 py-3">
        <div className="bg-muted p-2 rounded-lg">
            <Icon className="h-5 w-5 text-foreground/80" />
        </div>
        <div className="flex-1">
            <p className="font-medium text-foreground">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <p className={`text-xl font-bold text-right ${valueClassName}`}>{value}</p>
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
    const totalStockCostValue = batches.reduce((sum, b) => sum + (b.stock * (b.costPrice ?? 0)), 0);
    const totalStockSellingValue = batches.reduce((sum, b) => sum + (b.stock * b.sellingPrice), 0);
    const potentialProfit = totalStockSellingValue - totalStockCostValue;
    const overallMargin = totalStockCostValue > 0 ? (potentialProfit / totalStockCostValue) * 100 : 0;

    return {
        totalBatches,
        totalMasterProducts,
        totalStockQuantity,
        totalStockCostValue,
        totalStockSellingValue,
        potentialProfit,
        overallMargin
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

       <Card className="mt-8 bg-muted/20">
            <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>An advanced overview of your current inventory for decision management.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* General Stats */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">General</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <SummaryRow icon={Package} label="Master Products" value={summary.totalMasterProducts} />
                        <SummaryRow icon={Boxes} label="Total Batches" value={summary.totalBatches} />
                        <SummaryRow icon={Archive} label="Total Stock Units" value={summary.totalStockQuantity.toLocaleString()} />
                    </CardContent>
                </Card>

                {/* Financial Stats */}
                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle className="text-lg">Financials</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                         <div>
                            <p className="text-sm font-semibold text-muted-foreground pt-2 pb-1">ESTIMATED REVENUE</p>
                            <SummaryRow 
                                icon={Landmark} 
                                label="Total Stock Value (Sell)" 
                                value={`Rs. ${summary.totalStockSellingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                description="Total revenue if all stock is sold"
                            />
                        </div>
                        <div>
                             <p className="text-sm font-semibold text-muted-foreground pt-4 pb-1">COST & PROFITABILITY</p>
                            <SummaryRow 
                                icon={Wallet} 
                                label="Total Stock Value (Cost)" 
                                value={`Rs. ${summary.totalStockCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                description="Total investment in current stock"
                            />
                             <SummaryRow 
                                icon={TrendingUp} 
                                label="Potential Profit" 
                                value={`Rs. ${summary.potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                description="Estimated gross profit from current stock"
                                valueClassName={summary.potentialProfit >= 0 ? "text-green-600" : "text-red-600"}
                            />
                             <SummaryRow 
                                icon={Coins} 
                                label="Overall Margin" 
                                value={`${summary.overallMargin.toFixed(2)}%`}
                                description="Estimated return on investment"
                                valueClassName={summary.overallMargin >= 0 ? "text-green-600" : "text-red-600"}
                            />
                        </div>
                    </CardContent>
                </Card>

            </CardContent>
        </Card>
    </>
  );
}
