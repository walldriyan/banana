// src/components/transaction/CustomerInfoPanel.tsx
'use client';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormItem, FormMessage } from '@/components/ui/form';

export function CustomerInfoPanel() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormItem>
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            {...register('customer.name')}
            placeholder="e.g., John Doe"
          />
          {errors.customer?.name && (
            <FormMessage>{errors.customer.name.message?.toString()}</FormMessage>
          )}
        </FormItem>
        <FormItem>
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            {...register('customer.phone')}
            placeholder="e.g., 0771234567"
          />
           {errors.customer?.phone && (
            <FormMessage>{errors.customer.phone.message?.toString()}</FormMessage>
          )}
        </FormItem>
        <FormItem>
          <Label htmlFor="customerAddress">Address</Label>
          <Input
            id="customerAddress"
            {...register('customer.address')}
            placeholder="e.g., 123, Main St, Colombo"
          />
           {errors.customer?.address && (
            <FormMessage>{errors.customer.address.message?.toString()}</FormMessage>
          )}
        </FormItem>
      </CardContent>
    </Card>
  );
}
