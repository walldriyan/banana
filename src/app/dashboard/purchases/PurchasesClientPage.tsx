// src/app/dashboard/purchases/PurchasesClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoodsReceivedNote, Supplier } from '@prisma/client';
import { getGrnsAction } from '@/lib/actions/purchase.actions';
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

// Define a type for GRN with its relations for the client-side
export type GrnWithRelations = GoodsReceivedNote & { supplier: Supplier, items: GoodsReceivedNoteItem[] };
type GoodsReceivedNoteItem = import('@prisma/client').GoodsReceivedNoteItem;


export function PurchasesClientPage() {
  const [grns, setGrns] = useState<GrnWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<string | null>(null);

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
    setGrnToDelete(grnId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGrn = async () => {
    if (!grnToDelete) return;
    
    // const result = await deleteGrnAction(grnToDelete); // This action needs to be created

    // if (result.success) {
    //     toast({ title: "GRN Deleted", description: `The purchase record has been deleted.` });
    //     fetchGrns();
    // } else {
    //     toast({ variant: "destructive", title: "Error", description: result.error });
    // }

    toast({ title: "Info", description: `Delete functionality is not yet implemented.` });

    setIsDeleteDialogOpen(false);
    setGrnToDelete(null);
  };

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
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Deleting a GRN will affect product stock levels.
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
