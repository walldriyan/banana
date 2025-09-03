// src/components/transaction/PaymentPanel.tsx
'use client';
import React, { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
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
import { FormItem, FormMessage } from '../ui/form';

interface PaymentPanelProps {
  finalTotal: number;
}

export function PaymentPanel({ finalTotal }: PaymentPanelProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const paidAmount = watch('payment.paidAmount');

  useEffect(() => {
    const outstanding = finalTotal - (paidAmount || 0);
    setValue('payment.outstandingAmount', outstanding > 0 ? outstanding : 0, { shouldValidate: true });
  }, [paidAmount, finalTotal, setValue]);

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

        <FormItem>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Controller
            control={control}
            name="payment.paymentMethod"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
           {errors.payment?.paymentMethod && (
            <FormMessage>{errors.payment.paymentMethod.message?.toString()}</FormMessage>
          )}
        </FormItem>

        <FormItem>
          <Label htmlFor="paidAmount">Amount Paid</Label>
           <Controller
            control={control}
            name="payment.paidAmount"
            render={({ field }) => (
              <Input
                {...field}
                id="paidAmount"
                type="number"
                placeholder="e.g., 5000.00"
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
           {errors.payment?.paidAmount && (
            <FormMessage>{errors.payment.paidAmount.message?.toString()}</FormMessage>
          )}
        </FormItem>
        
        <FormItem>
            <div className="text-2xl font-bold text-red-600 text-center p-3 bg-red-50 rounded-lg">
            <div>Outstanding</div>
            <div>Rs. {watch('payment.outstandingAmount').toFixed(2)}</div>
            </div>
             {errors.payment?.outstandingAmount && (
                <FormMessage>{errors.payment.outstandingAmount.message?.toString()}</FormMessage>
            )}
        </FormItem>

        <FormItem className="flex items-center space-x-2 pt-4">
           <Controller
            control={control}
            name="payment.isInstallment"
            render={({ field }) => (
                <Switch 
                    id="installment-mode" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
            )}
           />
          <Label htmlFor="installment-mode">Pay by Installments</Label>
        </FormItem>

      </CardContent>
    </Card>
  );
}
