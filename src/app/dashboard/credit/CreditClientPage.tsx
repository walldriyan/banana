// src/app/dashboard/credit/CreditClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoodsReceivedNote, Supplier, PurchasePayment } from '@prisma/client';
import { getCreditorGrnsAction } from '@/lib/actions/credit.actions';
import { CreditDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePaymentsDrawer } from '@/components/credit/ManagePaymentsDrawer';


export type CreditorGrn = GoodsReceivedNote & {
    supplier: Supplier;
    totalPaid: number;
    _count: { payments: number };
};


export function CreditClientPage() {
  const [grns, setGrns] = useState<CreditorGrn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchCreditorGrns = useCallback(async () => {
    setIsLoading(true);
    const result = await getCreditorGrnsAction();
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
    fetchCreditorGrns();
  }, [fetchCreditorGrns]);
  
  const handlePaymentUpdate = useCallback(() => {
      fetchCreditorGrns(); // Refresh the main list when a payment is made
  }, [fetchCreditorGrns]);

  const openManagePaymentsDrawer = useCallback((grn: CreditorGrn) => {
    drawer.openDrawer({
        title: `Manage Payments for GRN: ${grn.grnNumber}`,
        description: `Supplier: ${grn.supplier.name}`,
        content: <ManagePaymentsDrawer grn={grn} onPaymentUpdate={handlePaymentUpdate} />,
        drawerClassName: 'sm:max-w-4xl'
    });
  }, [drawer, handlePaymentUpdate]);


  const columns = useMemo(() => getColumns(openManagePaymentsDrawer), [openManagePaymentsDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
      <CreditDataTable
        columns={columns}
        data={grns}
      />
  );
}
