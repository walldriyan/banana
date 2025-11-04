// src/app/dashboard/purchases/PurchasesClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoodsReceivedNote, Supplier } from '@prisma/client';
import { getGrnsAction, deleteGrnAction } from '@/lib/actions/purchase.actions';
import { PurchasesDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddPurchaseForm } from '@/components/purchases/AddPurchaseForm';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Banknote, Building, FileText, Landmark, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Define a type for GRN with its relations for the client-side
export type GrnWithRelations = GoodsReceivedNote & { supplier: Supplier, items: GoodsReceivedNoteItem[] };
type GoodsReceivedNoteItem = import('@prisma/client').GoodsReceivedNoteItem;


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


export function PurchasesClientPage() {
  const [grns, setGrns] = useState<GrnWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState<string | null>(null);


  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchGrns = useCallback(async () => {
    setIsLoading(true);
    const result = await getGrnsAction();
    if (result.success && result.data) {
      setGrns(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching GRNs',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchGrns();
  }, [fetchGrns]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchGrns();
  };

  const openAddGrnDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Purchase (GRN)',
      description: 'Record a new batch of products received from a supplier.',
      content: <AddPurchaseForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-6xl'
    });
  };

  const openEditGrnDrawer = useCallback((grn: GrnWithRelations) => {
    drawer.openDrawer({
        title: 'Edit Purchase (GRN)',
        description: `Editing GRN: ${grn.grnNumber}`,
        content: <AddPurchaseForm grn={grn} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-6xl'
    });
  }, [drawer, handleFormSuccess]);

  const handleDeleteRequest = (grnId: string) => {
    setDeletionError(null); // Clear previous errors
    setGrnToDelete(grnId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGrn = async () => {
    if (!grnToDelete) return;
    
    setDeletionError(null);
    const result = await deleteGrnAction(grnToDelete);

    if (result.success) {
        toast({ title: "GRN Deleted", description: `The purchase record has been successfully deleted.` });
        fetchGrns();
    } else {
        setDeletionError(result.error);
        toast({ 
            variant: "destructive", 
            title: "Deletion Failed", 
            description: result.error, // Display the specific error message from the server
            duration: 9000,
        });
    }

    setIsDeleteDialogOpen(false);
    setGrnToDelete(null);
  };

  const summary = useMemo(() => {
    const totalGrns = grns.length;
    const totalSuppliers = new Set(grns.map(g => g.supplierId)).size;
    const totalPurchaseValue = grns.reduce((sum, g) => sum + g.totalAmount, 0);
    const totalPaidValue = grns.reduce((sum, g) => sum + g.paidAmount, 0);
    const totalOutstandingValue = totalPurchaseValue - totalPaidValue;

    return {
        totalGrns,
        totalSuppliers,
        totalPurchaseValue,
        totalPaidValue,
        totalOutstandingValue,
    };
  }, [grns]);


  const columns = useMemo(() => getColumns(openEditGrnDrawer, handleDeleteRequest), [openEditGrnDrawer]);

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
      <PurchasesDataTable
        columns={columns}
        data={grns}
        onAddGrn={openAddGrnDrawer}
      />
      
      {deletionError && (
        <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deletion Error Details</AlertTitle>
            <AlertDescription className="break-all font-mono text-xs">
                {deletionError}
            </AlertDescription>
        </Alert>
      )}

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Deleting a GRN will remove the record and its associated product batches, affecting stock levels. This will fail if the GRN has associated payments or if its products have been sold.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteGrn} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
