// src/components/debtors/ManageSalePaymentsDrawer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { DebtorTransaction } from '@/app/dashboard/debtors/DebtorsClientPage';
import { AddSalePaymentForm } from './AddSalePaymentForm';
import { SalePaymentsList } from './SalePaymentsList';
import { getPaymentsForSaleAction, getDebtorTransactionByIdAction } from '@/lib/actions/debtor.actions';
import { SalePayment } from '@prisma/client';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';

interface ManageSalePaymentsDrawerProps {
    transaction: DebtorTransaction;
    onPaymentUpdate: () => void;
}

export function ManageSalePaymentsDrawer({ transaction: initialTransaction, onPaymentUpdate }: ManageSalePaymentsDrawerProps) {
    const [currentTransaction, setCurrentTransaction] = useState<DebtorTransaction>(initialTransaction);
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchTransactionAndPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            const [paymentsResult, transactionResult] = await Promise.all([
                getPaymentsForSaleAction(currentTransaction.id),
                getDebtorTransactionByIdAction(currentTransaction.id)
            ]);

            if (paymentsResult.success) {
                setPayments(paymentsResult.data || []);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch payment history.' });
            }

            if (transactionResult.success && transactionResult.data) {
                setCurrentTransaction(transactionResult.data);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not refresh transaction summary.' });
            }

        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to load updated data.' });
        } finally {
            setIsLoading(false);
        }
    }, [currentTransaction.id, toast]);

    useEffect(() => {
        fetchTransactionAndPayments();
    }, []); 
    
    const handleFormSuccess = () => {
        fetchTransactionAndPayments(); 
        onPaymentUpdate(); 
    }
    
    const balance = currentTransaction.finalTotal - currentTransaction.totalPaid;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
                 {isLoading ? (
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Separator />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                 ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-lg">
                                <span className="text-muted-foreground">Total Bill Amount:</span>
                                <span className="font-semibold">Rs. {currentTransaction.finalTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="text-muted-foreground">Total Paid:</span>
                                <span className="font-semibold text-green-600">Rs. {currentTransaction.totalPaid.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-2xl font-bold">
                                <span className="text-red-600">Balance Due:</span>
                                <span className="text-red-600">Rs. {balance.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                 )}
                <AuthorizationGuard permissionKey='debtors.manage'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Payment</CardTitle>
                            <CardDescription>Record a new installment or full payment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddSalePaymentForm transaction={currentTransaction} onSuccess={handleFormSuccess} />
                        </CardContent>
                    </Card>
                </AuthorizationGuard>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <SalePaymentsList payments={payments} onPaymentDeleted={handleFormSuccess} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
