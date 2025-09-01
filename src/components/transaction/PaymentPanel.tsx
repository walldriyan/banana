// src/components/transaction/PaymentPanel.tsx
'use client';
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PaymentData } from '@/lib/pos-data-transformer';

interface PaymentPanelProps {
  data: PaymentData;
  onDataChange: (data: PaymentData) => void;
  finalTotal: number;
}

export function PaymentPanel({ data, onDataChange, finalTotal }: PaymentPanelProps) {
  useEffect(() => {
    const outstanding = finalTotal - data.paidAmount;
    if (outstanding !== data.outstandingAmount) {
      onDataChange({ ...data, outstandingAmount: outstanding > 0 ? outstanding : 0 });
    }
  }, [data.paidAmount, finalTotal, onDataChange, data]);


  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const paid = parseFloat(e.target.value) || 0;
    onDataChange({ ...data, paidAmount: paid });
  };
  
  const handlePaymentMethodChange = (value: 'cash' | 'card' | 'online') => {
      onDataChange({ ...data, paymentMethod: value });
  };

  const handleInstallmentChange = (checked: boolean) => {
    onDataChange({ ...data, isInstallment: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold text-blue-600 text-center p-4 bg-blue-50 rounded-lg">
          <div>Total to Pay</div>
          <div>Rs. {finalTotal.toFixed(2)}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={data.paymentMethod} onValueChange={handlePaymentMethodChange}>
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidAmount">Amount Paid</Label>
          <Input
            id="paidAmount"
            type="number"
            value={data.paidAmount}
            onChange={handlePaidAmountChange}
            placeholder="e.g., 5000.00"
          />
        </div>
        
        <div className="text-2xl font-bold text-red-600 text-center p-3 bg-red-50 rounded-lg">
          <div>Outstanding</div>
          <div>Rs. {data.outstandingAmount.toFixed(2)}</div>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Switch 
            id="installment-mode" 
            checked={data.isInstallment}
            onCheckedChange={handleInstallmentChange}
          />
          <Label htmlFor="installment-mode">Pay by Installments</Label>
        </div>

      </CardContent>
    </Card>
  );
}
