// src/components/settings/discounts/DiscountSettings.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiscountSet } from '@prisma/client';
import { getDiscountSetsAction, deleteDiscountSetAction } from '@/lib/actions/discount.actions';
import { DiscountSetDataTable } from './data-table';
import { getColumns } from './columns';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCampaignForm } from './AddCampaignForm';

export function DiscountSettings() {
  const [discountSets, setDiscountSets] = useState<DiscountSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchDiscountSets = useCallback(async () => {
    setIsLoading(true);
    const result = await getDiscountSetsAction();
    if (result.success && result.data) {
      setDiscountSets(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching campaigns',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDiscountSets();
  }, [fetchDiscountSets]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchDiscountSets();
  };

  const openAddCampaignDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Discount Campaign',
      description: 'Define the basic details of your new campaign.',
      content: <AddCampaignForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-2xl'
    });
  };

  const openEditCampaignDrawer = useCallback((campaign: DiscountSet) => {
    drawer.openDrawer({
        title: 'Edit Discount Campaign',
        description: `Editing details for ${campaign.name}`,
        content: <AddCampaignForm campaign={campaign} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-2xl'
    });
  }, [drawer, handleFormSuccess]);

  const handleDeleteRequest = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    const result = await deleteDiscountSetAction(campaignToDelete);

    if (result.success) {
        toast({ title: "Campaign Deleted", description: `The campaign has been deleted.` });
        fetchDiscountSets();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditCampaignDrawer, handleDeleteRequest), [openEditCampaignDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discount Campaigns</CardTitle>
        <CardDescription>
          Manage all discount campaigns. Add, edit, or delete campaigns that can be used in the POS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DiscountSetDataTable
            columns={columns}
            data={discountSets}
            onAddCampaign={openAddCampaignDrawer}
        />
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the discount campaign and all its associated rules. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteCampaign} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
