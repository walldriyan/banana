// src/components/POSUI/CustomDiscountForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDrawer } from '@/hooks/use-drawer';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

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

  const preview = useMemo(() => {
    const value = Number(discountValue);
    if (isNaN(value) || value <= 0) return null;

    const originalTotal = item.price * item.quantity;
    let totalDiscount = 0;
    let explanation: React.ReactNode = '';

    if (discountType === 'percentage') {
        totalDiscount = (originalTotal * value) / 100;
        explanation = (
            <p className="text-sm">
                ඔයා තෝරගත්ත <strong className="text-green-600">{item.product.name}</strong> කියන item එකේ සම්පූර්ණ වටිනාකමෙන් (Line Total) <strong className="font-mono">{value}%</strong> ක Discount එකක් තමයි ලැබෙන්නේ.
            </p>
        );
    } else { // fixed
      if (applyOnce) {
        totalDiscount = value;
         explanation = (
            <p className="text-sm">
                ඔයා තෝරගත්ත <strong className="text-green-600">{item.product.name}</strong> කියන item එකට, ඔයා ගන්න Quantity එක මොකක් වුණත්, එක පාරක් විතරක් <strong className="font-mono">රු. {value.toFixed(2)}</strong> ක ස්ථාවර (fixed) Discount එකක් ලැබෙනවා.
            </p>
        );
      } else {
        totalDiscount = value * item.quantity;
         explanation = (
            <p className="text-sm">
                ඔයා තෝරගත්ත <strong className="text-green-600">{item.product.name}</strong> කියන item එකේ, ඔයා ගන්න හැම ඒකකයකටම (per-unit) <strong className="font-mono">රු. {value.toFixed(2)}</strong> බැගින් Discount එකක් ලැබෙනවා. ඔයා ගන්න Quantity එක අනුව මුළු වට්ටම වෙනස් වෙනවා.
            </p>
        );
      }
    }
    
    // Cap the discount
    totalDiscount = Math.min(totalDiscount, originalTotal);
    
    const finalPrice = originalTotal - totalDiscount;

    return {
      totalDiscount,
      finalPrice,
      explanation,
    };

  }, [discountType, discountValue, applyOnce, item]);

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
    if (discountType === 'fixed' && !applyOnce && valueAsNumber > item.price) {
        setError('Per-unit fixed discount cannot be greater than the unit price.');
        return;
    }
    if (discountType === 'fixed' && applyOnce && valueAsNumber > (item.price * item.quantity)) {
      setError('One-time fixed discount cannot be greater than the line total.');
      return;
    }

    setError('');
    onApplyDiscount(item.saleItemId, discountType, valueAsNumber, applyOnce);
  };
  
  const handleRemoveDiscount = () => {
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
                checked={!applyOnce}
                onCheckedChange={(checked) => setApplyOnce(!checked)}
            />
        </div>
      )}

      {preview && (
          <Alert className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <Info className="h-4 w-4" />
              <AlertTitle className="font-semibold text-primary">වට්ටමේ බලපෑම (Preview)</AlertTitle>
              <AlertDescription className="space-y-2 mt-2 text-foreground/90">
                 <div>{preview.explanation}</div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 mt-2 space-y-1">
                      <div className="flex justify-between font-medium">
                          <span>මුළු Discount එක:</span>
                          <span>- රු. {preview.totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base">
                          <span>නව අවසාන මිල:</span>
                          <span className="text-green-600 dark:text-green-400">රු. {preview.finalPrice.toFixed(2)}</span>
                      </div>
                  </div>
              </AlertDescription>
          </Alert>
      )}


      <div className="flex justify-between items-center pt-4 border-t">
        <Button 
            type="button" 
            variant="destructive"
            onClick={handleRemoveDiscount}
            disabled={!item.customDiscountValue}
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
