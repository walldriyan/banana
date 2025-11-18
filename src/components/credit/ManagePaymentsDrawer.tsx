// src/components/credit/ManagePaymentsDrawer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CreditorGrn } from '@/app/dashboard/credit/CreditClientPage';
import { AddPaymentForm } from './AddPaymentForm';
import { PaymentsList } from './PaymentsList';
import { getPaymentsForGrnAction, getCreditGrnByIdAction } from '@/lib/actions/credit.actions';
import { PurchasePayment } from '@prisma/client';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';

interface ManagePaymentsDrawerProps {
    grn: CreditorGrn;
    onPaymentUpdate: () => void;
}

export function ManagePaymentsDrawer({ grn: initialGrn, onPaymentUpdate }: ManagePaymentsDrawerProps) {
    const [currentGrn, setCurrentGrn] = useState<CreditorGrn>(initialGrn);
    const [payments, setPayments] = useState<PurchasePayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchGrnAndPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            const [paymentsResult, grnResult] = await Promise.all([
                getPaymentsForGrnAction(currentGrn.id),
                getCreditGrnByIdAction(currentGrn.id)
            ]);

            if (paymentsResult.success) {
                setPayments(paymentsResult.data || []);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch payment history.' });
            }

            if (grnResult.success && grnResult.data) {
                setCurrentGrn(grnResult.data);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not refresh GRN summary.' });
            }

        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to load updated data.' });
        } finally {
            setIsLoading(false);
        }
    }, [currentGrn.id, toast]);
    

    useEffect(() => {
        // Initial fetch when component mounts
        fetchGrnAndPayments();
    }, []); // Run only once on mount
    
    const handleFormSuccess = () => {
        fetchGrnAndPayments(); // Re-fetch both GRN summary and payments list
        onPaymentUpdate(); // Also trigger the main GRN list refresh in the parent page
    }
    
    const balance = currentGrn.totalAmount - currentGrn.totalPaid;

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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-lg">
                                <span className="text-muted-foreground">Total Bill Amount:</span>
                                <span className="font-semibold">Rs. {currentGrn.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="text-muted-foreground">Total Paid:</span>
                                <span className="font-semibold text-green-600">Rs. {currentGrn.totalPaid.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-2xl font-bold">
                                <span className="text-red-600">Balance Due:</span>
                                <span className="text-red-600">Rs. {balance.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                 )}
                <AuthorizationGuard permissionKey='credit.manage'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Payment</CardTitle>
                            <CardDescription>Record a new installment or full payment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddPaymentForm grn={currentGrn} onSuccess={handleFormSuccess} />
                        </CardContent>
                    </Card>
                </AuthorizationGuard>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <PaymentsList payments={payments} onPaymentDeleted={handleFormSuccess} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
