// src/components/POSUI/CustomDiscountForm.tsx
'use client';

import React, { useState } from 'react';
import type { SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDrawer } from '@/hooks/use-drawer';
import { Switch } from '../ui/switch';

interface CustomDiscountFormProps {
  item: SaleItem;
  onApplyDiscount: (saleItemId: string, type: 'fixed' | 'percentage', value: number, applyOnce: boolean) => void;
}

export function CustomDiscountForm({ item, onApplyDiscount }: CustomDiscountFormProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(item.customDiscountType || 'percentage');
  const [discountValue, setDiscountValue] = useState<number | string>(item.customDiscountValue || '');
  // applyOnce = true means "Apply as a single, one-time discount"
  // applyOnce = false means "Apply discount to each unit"
  const [applyOnce, setApplyOnce] = useState<boolean>(item.customApplyFixedOnce ?? true);
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
    if (discountType === 'fixed' && valueAsNumber > item.price && applyOnce === false) {
        setError('Per-unit fixed discount cannot be greater than the unit price.');
        return;
    }
    if (discountType === 'fixed' && valueAsNumber > (item.price * item.quantity) && applyOnce === true) {
      setError('One-time fixed discount cannot be greater than the line total.');
      return;
    }


    setError('');
    // For percentage discounts, `applyOnce` is irrelevant, but we pass it anyway.
    // The logic to ignore it is in the discount engine.
    onApplyDiscount(item.saleItemId, discountType, valueAsNumber, applyOnce);
  };
  
  const handleRemoveDiscount = () => {
    // A value of 0 will effectively remove the custom discount
    onApplyDiscount(item.saleItemId, 'fixed', 0, false);
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

       {discountType === 'fixed' && (
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <Label htmlFor="apply-mode">Apply Per-Unit</Label>
                <p className="text-[0.8rem] text-muted-foreground">
                   {applyOnce ? 'OFF: Discount is applied once to the whole line.' : 'ON: Discount is multiplied by quantity.'}
                </p>
            </div>
            <Switch
                id="apply-mode"
                // The switch is "ON" when we want to apply per-unit (applyOnce = false)
                checked={!applyOnce}
                // When checked (ON), it means apply per unit, so set applyOnce to false.
                onCheckedChange={(checked) => setApplyOnce(!checked)}
            />
        </div>
      )}


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
