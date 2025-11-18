// src/app/dashboard/company/CompanyClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Company } from '@prisma/client';
import { getCompaniesAction, deleteCompanyAction } from '@/lib/actions/company.actions';
import { CompanyDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddCompanyForm } from '@/components/company/AddCompanyForm';
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

export function CompanyClientPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    const result = await getCompaniesAction();
    if (result.success && result.data) {
      setCompanies(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching companies',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchCompanies();
  };

  const openAddCompanyDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Company',
      description: 'Fill in the details below to add a new company.',
      content: <AddCompanyForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-md'
    });
  };

  const openEditCompanyDrawer = useCallback((company: Company) => {
    drawer.openDrawer({
        title: 'Edit Company',
        description: `Editing details for ${company.name}`,
        content: <AddCompanyForm company={company} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-md'
    });
  }, [drawer, handleFormSuccess]);

  const handleDeleteRequest = (companyId: string) => {
    setCompanyToDelete(companyId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    const result = await deleteCompanyAction(companyToDelete);

    if (result.success) {
        toast({ title: "Company Deleted", description: `Company has been deleted.` });
        fetchCompanies();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditCompanyDrawer, handleDeleteRequest), [openEditCompanyDrawer, handleDeleteRequest]);

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
      <CompanyDataTable
        columns={columns}
        data={companies}
        onAddCompany={openAddCompanyDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the company profile.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteCompany} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
