// src/components/transaction/CustomerInfoPanel.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CustomerData } from '@/lib/pos-data-transformer';

interface CustomerInfoPanelProps {
  data: CustomerData;
  onDataChange: (data: CustomerData) => void;
}

export function CustomerInfoPanel({ data, onDataChange }: CustomerInfoPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input
            id="name"
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="e.g., John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            value={data.phone}
            onChange={handleChange}
            placeholder="e.g., 0771234567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={data.address}
            onChange={handleChange}
            placeholder="e.g., 123, Main St, Colombo"
          />
        </div>
      </CardContent>
    </Card>
  );
}
