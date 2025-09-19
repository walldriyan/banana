// src/components/credit/ManagePaymentsDrawer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { CreditorGrn } from '@/app/dashboard/credit/CreditClientPage';
import { AddPaymentForm } from './AddPaymentForm';
import { PaymentsList } from './PaymentsList';
import { getPaymentsForGrnAction } from '@/lib/actions/credit.actions';
import { PurchasePayment } from '@prisma/client';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';

interface ManagePaymentsDrawerProps {
    grn: CreditorGrn;
    onPaymentUpdate: () => void;
}

export function ManagePaymentsDrawer({ grn, onPaymentUpdate }: ManagePaymentsDrawerProps) {
    const [payments, setPayments] = useState<PurchasePayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        const result = await getPaymentsForGrnAction(grn.id);
        if (result.success) {
            setPayments(result.data || []);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch payment history.' });
        }
        setIsLoading(false);
    }, [grn.id, toast]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);
    
    const handleFormSuccess = () => {
        fetchPayments(); // Refresh payments list
        onPaymentUpdate(); // Refresh the main GRN list
    }
    
    const balance = grn.totalAmount - grn.totalPaid;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-lg">
                            <span className="text-muted-foreground">Total Bill Amount:</span>
                            <span className="font-semibold">Rs. {grn.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span className="text-muted-foreground">Total Paid:</span>
                            <span className="font-semibold text-green-600">Rs. {grn.totalPaid.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-2xl font-bold">
                            <span className="text-red-600">Balance Due:</span>
                            <span className="text-red-600">Rs. {balance.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <AuthorizationGuard permissionKey='credit.manage'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Payment</CardTitle>
                            <CardDescription>Record a new installment or full payment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddPaymentForm grn={grn} onSuccess={handleFormSuccess} />
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
