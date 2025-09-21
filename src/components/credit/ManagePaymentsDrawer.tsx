// src/components/credit/ManagePaymentsDrawer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { CreditorGrn } from '@/app/dashboard/credit/CreditClientPage';
import { AddPaymentForm } from './AddPaymentForm';
import { PaymentsList } from './PaymentsList';
import { getPaymentsForGrnAction, getCreditGrnByIdAction } from '@/lib/actions/credit.actions';
import { PurchasePayment } from '@prisma/client';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';
import { Printer } from 'lucide-react';
import { GrnReceipt } from './GrnReceipt';

const receiptStyles = `
  body { font-family: monospace; color: black; background-color: white; margin: 0; padding: 5px; font-size: 10px; }
  .thermal-receipt-container { background-color: white; color: black; font-family: monospace; font-size: 10px; max-width: 300px; margin: 0 auto; padding: 8px; }
  .text-center { text-align: center; }
  .space-y-1 > * + * { margin-top: 4px; }
  .text-lg { font-size: 1.125rem; }
  .font-bold { font-weight: 700; }
  .border-t { border-top-width: 1px; }
  .border-dashed { border-style: dashed; }
  .border-black { border-color: black; }
  .my-1 { margin-top: 4px; margin-bottom: 4px; }
  .w-full { width: 100%; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .text-base { font-size: 1rem; }
  .italic { font-style: italic; }
  .text-gray-600 { color: #555; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .font-bold { font-weight: bold; }
  .text-green-700 { color: #047857; }
  .text-blue-700 { color: #1d4ed8; }
  .text-red-600 { color: #dc2626; }
  .mt-2 { margin-top: 8px; }
  .text-xs { font-size: 0.75rem; }
  .capitalize { text-transform: capitalize; }
`;

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
    
    const handlePrint = async () => {
        const ReactDOMServer = (await import('react-dom/server')).default;
        const receiptHTML = ReactDOMServer.renderToString(
          <GrnReceipt grn={currentGrn} payments={payments} />
        );

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`<html><head><title>Print GRN Statement</title><style>${receiptStyles}</style></head><body>${receiptHTML}</body></html>`);
          iframeDoc.close();
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }

        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
    };

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
                             <Button onClick={handlePrint} variant="outline" size="sm">
                                <Printer className="mr-2 h-4 w-4" />
                                Print Statement
                            </Button>
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
