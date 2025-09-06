// src/components/POSUI/CustomDiscountForm.tsx
'use client';

import React, { useState } from 'react';
import type { SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDrawer } from '@/hooks/use-drawer';

interface CustomDiscountFormProps {
  item: SaleItem;
  onApplyDiscount: (saleItemId: string, type: 'fixed' | 'percentage', value: number) => void;
}

export function CustomDiscountForm({ item, onApplyDiscount }: CustomDiscountFormProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(item.customDiscountType || 'percentage');
  const [discountValue, setDiscountValue] = useState<number | string>(item.customDiscountValue || '');
  const [error, setError] = useState<string>('');
  const drawer = useDrawer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valueAsNumber = Number(discountValue);

    if (isNaN(valueAsNumber) || valueAsNumber < 0) {
      setError('Please enter a valid, non-negative number.');
      return;
    }
    if (discountType === 'percentage' && valueAsNumber > 100) {
      setError('Percentage discount cannot exceed 100.');
      return;
    }

    setError('');
    onApplyDiscount(item.saleItemId, discountType, valueAsNumber);
  };
  
  const handleRemoveDiscount = () => {
    // A value of 0 will effectively remove the custom discount
    onApplyDiscount(item.saleItemId, 'fixed', 0);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Discount Type</Label>
        <RadioGroup
          value={discountType}
          onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="r-percentage" />
            <Label htmlFor="r-percentage">Percentage (%)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="r-fixed" />
            <Label htmlFor="r-fixed">Fixed Amount (Rs.)</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="discount-value">Discount Value</Label>
        <Input
          id="discount-value"
          type="number"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          placeholder={discountType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 500 for Rs. 500'}
          required
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button 
            type="button" 
            variant="destructive"
            onClick={handleRemoveDiscount}
            disabled={item.customDiscountValue === undefined}
        >
            Remove Override
        </Button>
        <div className='flex gap-2'>
            <Button type="button" variant="outline" onClick={drawer.closeDrawer}>
                Cancel
            </Button>
            <Button type="submit">Apply Discount</Button>
        </div>
      </div>
    </form>
  );
}
