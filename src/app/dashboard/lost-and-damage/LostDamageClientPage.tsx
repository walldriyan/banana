// src/app/dashboard/lost-and-damage/LostDamageClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
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
} from "@/components/ui/alert-dialog";
import { getLostAndDamageAction, deleteLostAndDamageAction } from '@/lib/actions/inventory.actions';
import { LostDamageDataTable } from './data-table';
import { getColumns } from './columns';
import { AddLostDamageForm } from '@/components/inventory/AddLostDamageForm';
import { LostAndDamage, ProductBatch, Product } from '@prisma/client';

export type LostAndDamageRecord = LostAndDamage & {
    productBatch: ProductBatch & {
        product: Product;
    };
};

export function LostDamageClientPage() {
  const [records, setRecords] = useState<LostAndDamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const result = await getLostAndDamageAction();
    if (result.success && result.data) {
      setRecords(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching records',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchRecords();
  };

  const openAddRecordDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Lost/Damage Record',
      description: 'Select a product batch and specify the quantity lost or damaged.',
      content: <AddLostDamageForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-xl'
    });
  };

  const handleDeleteRequest = (recordId: string) => {
    setRecordToDelete(recordId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    const result = await deleteLostAndDamageAction(recordToDelete);

    if (result.success) {
        toast({ title: "Record Deleted", description: `The record has been deleted and stock has been restored.` });
        fetchRecords();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  const columns = useMemo(() => getColumns(handleDeleteRequest), []);

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
      <LostDamageDataTable
        columns={columns}
        data={records}
        onAddRecord={openAddRecordDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the record and **restore** the adjusted stock quantity to the product batch.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteRecord} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
