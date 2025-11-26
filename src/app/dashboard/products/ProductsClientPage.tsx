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
import { Package, Archive, DollarSign, Landmark, TrendingUp, Coins, AlertTriangle, Boxes, Wallet, ArchiveX } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ImportProductsModal } from '@/components/products/ImportProductsModal';


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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);


  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    const result = await getProductBatchesAction();
    if (result.success && result.data) {
      console.log("[ProductsClientPage] Fetched data from DB:", JSON.stringify(result.data, null, 2));
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
  
  const handleImportSuccess = () => {
    setIsImportModalOpen(false);
    fetchBatches(); // Refresh list after successful import
  };

  const handleExport = async () => {
    toast({ title: "Exporting...", description: "Preparing your product data for download." });
    try {
        const result = await getProductBatchesAction();
        if (!result.success || !result.data) {
            throw new Error(result.error || "Failed to fetch data for export.");
        }
        
        const dataToExport = result.data;

        // Define CSV headers
        const headers = [
            "ProductID", "ProductName", "Category", "Brand",
            "BatchID", "BatchNumber", "Stock", "CostPrice", "SellingPrice",
            "Barcode", "SupplierID", "ManufactureDate", "ExpiryDate", "DateAdded"
        ];
        
        // Convert JSON to CSV string
        const csvRows = [headers.join(',')];
        for (const row of dataToExport) {
            const values = [
                `"${row.product.id}"`,
                `"${row.product.name.replace(/"/g, '""')}"`,
                `"${row.product.category.replace(/"/g, '""')}"`,
                `"${row.product.brand.replace(/"/g, '""')}"`,
                `"${row.id}"`,
                `"${row.batchNumber}"`,
                row.stock,
                row.costPrice,
                row.sellingPrice,
                `"${row.barcode || ''}"`,
                `"${row.supplierId || ''}"`,
                `"${row.manufactureDate ? new Date(row.manufactureDate).toISOString() : ''}"`,
                `"${row.expiryDate ? new Date(row.expiryDate).toISOString() : ''}"`,
                `"${new Date(row.addedDate).toISOString()}"`,
            ];
            csvRows.push(values.join(','));
        }
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        // Create a link and trigger download
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "products.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Export Complete!", description: "Your products.csv file has started downloading." });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred during export.",
        });
    }
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
        return batches.filter(batch => parseFloat(batch.stock) > 0);
      }
      return batches;
  }, [batches, hideZeroStock]);


  const summary = useMemo(() => {
    const totalBatches = batches.length;
    const totalMasterProducts = new Set(batches.map(b => b.productId)).size;
    const totalStockQuantity = batches.reduce((sum, b) => sum + parseFloat(b.stock), 0);
    const totalStockCostValue = batches.reduce((sum, b) => sum + (parseFloat(b.stock) * (b.costPrice ?? 0)), 0);
    const totalStockSellingValue = batches.reduce((sum, b) => sum + (parseFloat(b.stock) * b.sellingPrice), 0);
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
    <div className="flex-1 flex flex-col min-h-0">
      <Card className="flex flex-col flex-1">
        <CardContent className="flex flex-col flex-1 p-6">
          <ProductsDataTable
            columns={columns}
            data={filteredBatches}
            onAddProduct={openAddProductDrawer}
            onImport={() => setIsImportModalOpen(true)}
            onExport={handleExport}
            hideZeroStock={hideZeroStock}
            onHideZeroStockChange={setHideZeroStock}
          />
        </CardContent>
      </Card>
      
      <ImportProductsModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={handleImportSuccess}
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
    </div>
  );
}
