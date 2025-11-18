// src/components/debtors/SalePaymentsList.tsx
"use client";

import { SalePayment } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { useState } from "react";
import { deleteSalePaymentAction } from "@/lib/actions/debtor.actions";
import { AuthorizationGuard } from "../auth/AuthorizationGuard";

interface SalePaymentsListProps {
    payments: SalePayment[];
    onPaymentDeleted: () => void;
}

export function SalePaymentsList({ payments, onPaymentDeleted }: SalePaymentsListProps) {
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

    const handleDeleteRequest = (paymentId: string) => {
        setPaymentToDelete(paymentId);
        setIsDeleteDialogOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!paymentToDelete) return;

        const result = await deleteSalePaymentAction(paymentToDelete);
        if (result.success) {
            toast({ title: 'Payment Deleted', description: 'The payment record has been removed.' });
            onPaymentDeleted();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsDeleteDialogOpen(false);
        setPaymentToDelete(null);
    }

    if (payments.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No payment history found.</p>;
    }

    return (
        <>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map(p => (
                        <TableRow key={p.id}>
                            <TableCell>{format(new Date(p.paymentDate), 'PP')}</TableCell>
                            <TableCell className="capitalize">{p.paymentMethod}</TableCell>
                            <TableCell className="text-right font-medium">Rs. {p.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <AuthorizationGuard permissionKey="debtors.manage">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(p.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </AuthorizationGuard>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this payment record and update the transaction's balance. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
