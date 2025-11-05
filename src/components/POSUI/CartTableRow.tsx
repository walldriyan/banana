// src/components/POSUI/CartTableRow.tsx
'use client';
import React, { useMemo } from 'react';
import type { SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Tag, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { useProductUnits } from '@/hooks/use-product-units';

interface CartTableRowProps {
  item: SaleItem;
  isCalculating: boolean;
  discountResult: any; // Using any because it's a plain object from server
  onUpdateQuantity: (saleItemId: string, newDisplayQuantity: number, newDisplayUnit?: string) => void;
  onOverrideDiscount: (item: SaleItem) => void;
}

export function CartTableRow({ item, isCalculating, discountResult, onUpdateQuantity, onOverrideDiscount }: CartTableRowProps) {
  const lineItemResult = discountResult?.lineItems?.find((li: any) => li.lineId === item.saleItemId);
  const hasDiscounts = lineItemResult && lineItemResult.totalDiscount > 0;
  const originalLineTotal = item.price * item.quantity;
  const finalLineTotal = lineItemResult ? originalLineTotal - lineItemResult.totalDiscount : originalLineTotal;
  const isCustomDiscount = item.customDiscountValue !== undefined && item.customDiscountValue > 0;
  
  const units = useProductUnits(item.product.units);
  const allUnits = useMemo(() => [
    { name: units.baseUnit, conversionFactor: 1 }, 
    ...(units.derivedUnits || [])
  ], [units]);
  const hasDerivedUnits = allUnits.length > 1;

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newQuantity = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      onUpdateQuantity(item.saleItemId, newQuantity);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <p className="font-semibold text-foreground">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">Batch: {item.batchNumber}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(item.saleItemId, item.displayQuantity - 1)}
          >
            -
          </Button>
          <Input
            type="number"
            value={item.displayQuantity}
            onChange={handleQuantityInputChange}
            onBlur={(e) => { if (e.target.value === '' || parseFloat(e.target.value) <= 0) { onUpdateQuantity(item.saleItemId, 1); } }}
            className="w-16 h-8 text-center"
            step="0.01"
          />
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(item.saleItemId, item.displayQuantity + 1)}
          >
            +
          </Button>
           {hasDerivedUnits ? (
            <Select 
                value={item.displayUnit}
                onValueChange={(newUnit) => onUpdateQuantity(item.saleItemId, item.displayQuantity, newUnit)}
            >
                <SelectTrigger className="w-[80px] h-8 ml-2 text-xs">
                    <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                    {allUnits.map(u => (
                        <SelectItem key={u.name} value={u.name} className="text-xs">{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : (
             <span className="text-xs text-muted-foreground ml-2">{units.baseUnit}</span>
        )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">Rs. {item.price.toFixed(2)}</div>
         <div className="text-xs text-muted-foreground line-through">
              {hasDiscounts ? `Rs. ${originalLineTotal.toFixed(2)}` : ''}
          </div>
      </TableCell>
      <TableCell>
        {isCalculating ? <Skeleton className="h-6 w-full" /> : (
           <div className="flex flex-col items-center gap-1">
            {hasDiscounts && lineItemResult && (
              <div className="space-y-1 w-full">
                {isCustomDiscount ? (
                  <p className="flex items-center text-xs bg-yellow-100/20 text-yellow-700 dark:text-yellow-300 p-1 rounded-md">
                    <span className="font-bold truncate pr-1">Manual</span>
                    <span className="font-semibold bg-yellow-200/30 px-1.5 py-0.5 rounded-full">
                      {item.customDiscountType === 'percentage' ? `${item.customDiscountValue}%` : `Rs. ${item.customDiscountValue}`}
                    </span>
                  </p>
                ) : (
                  lineItemResult.appliedRules.map((rule: any, i: number) => (
                    <p key={i} className="text-xs text-green-600">
                      -Rs. {rule.discountAmount.toFixed(2)}
                      <span className="text-muted-foreground ml-1">({rule.appliedRuleInfo.sourceRuleName})</span>
                    </p>
                  ))
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-center" onClick={() => onOverrideDiscount(item)}>
                <Tag className="mr-1 h-3 w-3" />
                {isCustomDiscount ? 'Edit' : hasDiscounts ? 'Override' : 'Add'}
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isCalculating ? <Skeleton className="h-7 w-20 ml-auto" /> : (
          <>
            <p className="font-bold text-base text-foreground">Rs. {finalLineTotal.toFixed(2)}</p>
            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 w-6 h-6 mt-1 ml-auto"
                onClick={() => onUpdateQuantity(item.saleItemId, 0)}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </TableCell>
    </TableRow>
  );
}
