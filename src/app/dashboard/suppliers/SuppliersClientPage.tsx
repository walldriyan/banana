// src/app/dashboard/suppliers/SuppliersClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Supplier } from '@prisma/client';
import { getSuppliersAction, deleteSupplierAction } from '@/lib/actions/supplier.actions';
import { SuppliersDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddSupplierForm } from '@/components/suppliers/AddSupplierForm';
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

export function SuppliersClientPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    const result = await getSuppliersAction();
    if (result.success && result.data) {
      setSuppliers(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching suppliers',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchSuppliers();
  };

  const openAddSupplierDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Supplier',
      description: 'Fill in the details below to add a new supplier.',
      content: <AddSupplierForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-md'
    });
  };

  const openEditSupplierDrawer = useCallback((supplier: Supplier) => {
    drawer.openDrawer({
        title: 'Edit Supplier',
        description: `Editing details for ${supplier.name}`,
        content: <AddSupplierForm supplier={supplier} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-md'
    });
  }, [drawer, handleFormSuccess]);

  const handleDeleteRequest = (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    
    const result = await deleteSupplierAction(supplierToDelete);

    if (result.success) {
        toast({ title: "Supplier Deleted", description: `Supplier has been deleted.` });
        fetchSuppliers();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditSupplierDrawer, handleDeleteRequest), [openEditSupplierDrawer]);

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
      <SuppliersDataTable
        columns={columns}
        data={suppliers}
        onAddSupplier={openAddSupplierDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the supplier.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteSupplier} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
