// src/components/transaction/TransactionDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { PaymentPanel } from './PaymentPanel';
import { PrintPreview } from './PrintPreview';
import type { SaleItem } from '@/types';
import type { DiscountResult } from '@/discount-engine/core/result';
import { transformTransactionDataForDb } from '@/lib/pos-data-transformer';
import type { CustomerData, PaymentData, DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: SaleItem[];
  discountResult: DiscountResult;
  transactionId: string;
  onTransactionComplete: () => void;
}

export function TransactionDialog({
  isOpen,
  onClose,
  cart,
  discountResult,
  transactionId,
  onTransactionComplete,
}: TransactionDialogProps) {
  const [step, setStep] = useState<'details' | 'print'>('details');
  const [showFullPrice, setShowFullPrice] = useState(false); // New state for the toggle
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: 'Walk-in Customer',
    phone: '',
    address: '',
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paidAmount: 0,
    paymentMethod: 'cash',
    outstandingAmount: 0,
    isInstallment: false,
  });
  const [finalTransactionData, setFinalTransactionData] = useState<DatabaseReadyTransaction | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setStep('details');
      setPaymentData({
        paidAmount: discountResult.finalTotal,
        paymentMethod: 'cash',
        outstandingAmount: 0,
        isInstallment: false,
      });
    }
  }, [isOpen, discountResult.finalTotal]);

  const handleConfirmAndPreview = () => {
    const preparedData = transformTransactionDataForDb({
      cart,
      discountResult,
      transactionId,
      customerData,
      paymentData,
    });
    console.log('Transaction Data Prepared for DB:', JSON.stringify(preparedData, null, 2));
    setFinalTransactionData(preparedData);
    setStep('print');
  };

  const handleConfirmAndPrint = () => {
    // In a real app, this would trigger the browser's print dialog
    // For now, we'll just log it and close the dialog
    console.log("Printing receipt...");
    onTransactionComplete();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Transaction</DialogTitle>
              <DialogDescription>
                Confirm customer and payment details to finalize the sale.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-grow overflow-y-auto">
              <CustomerInfoPanel data={customerData} onDataChange={setCustomerData} />
              <PaymentPanel
                data={paymentData}
                onDataChange={setPaymentData}
                finalTotal={discountResult.finalTotal}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirmAndPreview}>Confirm & Preview Receipt</Button>
            </DialogFooter>
          </>
        )}
        {step === 'print' && finalTransactionData && (
          <>
            <DialogHeader>
                <DialogTitle>Print Preview</DialogTitle>
                <DialogDescription>
                    This is a preview of the final receipt. You can toggle the billing mode.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto bg-gray-100 p-4 rounded-md overflow-y-scroll">
              <PrintPreview data={finalTransactionData} showFullPrice={showFullPrice} />
            </div>
            <DialogFooter className="items-center">
                <div className="flex items-center space-x-2 mr-auto">
                    <Switch
                        id="billing-mode"
                        checked={showFullPrice}
                        onCheckedChange={setShowFullPrice}
                    />
                    <Label htmlFor="billing-mode">Show Full Price (Gift Discount)</Label>
                </div>
                <Button variant="outline" onClick={() => setStep('details')}>Back to Details</Button>
                <Button onClick={handleConfirmAndPrint}>Confirm & Print</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
