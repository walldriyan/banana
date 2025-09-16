// src/components/POSUI/CartItemCard.tsx
import React from 'react';
import type { SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Tag, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '../ui/skeleton';

interface CartItemCardProps {
  item: SaleItem;
  isCalculating: boolean;
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  onUpdateQuantity: (saleItemId: string, newDisplayQuantity: number, newDisplayUnit?: string) => void;
  onOverrideDiscount: (item: SaleItem) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, isCalculating, discountResult, onUpdateQuantity, onOverrideDiscount }) => {

  const lineItemResult = (discountResult && discountResult.lineItems)
    ? discountResult.lineItems.find((li: any) => li.lineId === item.saleItemId)
    : undefined;

  const hasDiscounts = lineItemResult && lineItemResult.totalDiscount > 0;
  const originalLineTotal = item.price * item.quantity;
  const finalLineTotal = lineItemResult ? originalLineTotal - lineItemResult.totalDiscount : originalLineTotal;
  
  const isCustomDiscount = item.customDiscountValue !== undefined;

  const allUnits = [{ name: item.units.baseUnit, conversionFactor: 1 }, ...(item.units.derivedUnits || [])];
  const hasDerivedUnits = allUnits.length > 1;

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for user-friendliness, treat as 0
    const newQuantity = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      onUpdateQuantity(item.saleItemId, newQuantity);
    }
  };


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 ease-in-out">
      {/* Top section: Name and Price */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-grow">
          <p className="font-semibold text-gray-900">
            {item.name}{' '}
            {item.selectedBatch && (
              <span className="text-sm font-normal text-gray-500">
                (Batch: {item.selectedBatch.batchNumber})
              </span>
            )}
          </p>
          <p className="text-sm text-gray-600">Rs. {item.price.toFixed(2)} / {item.units.baseUnit}</p>
        </div>
        {isCalculating ? (
            <Skeleton className="h-7 w-24" />
        ) : (
            <p className="text-right font-bold text-lg text-gray-800">
                Rs. {finalLineTotal.toFixed(2)}
            </p>
        )}
      </div>

      {/* Middle section: Quantity and Unit Controls */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
           <button
            onClick={() => onUpdateQuantity(item.saleItemId, item.displayQuantity - 1)}
            className="rounded-full w-7 h-7 border bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition"
          >
            -
          </button>
           <Input
                type="number"
                value={item.displayQuantity}
                onChange={handleQuantityInputChange}
                onBlur={(e) => {
                    // If the user leaves the input empty, set it back to 1 to avoid confusion
                    if (e.target.value === '' || parseFloat(e.target.value) <= 0) {
                        onUpdateQuantity(item.saleItemId, 1);
                    }
                }}
                className="w-20 h-9 text-center"
                step="0.01" // Allow decimal inputs
            />
          <button
            onClick={() => onUpdateQuantity(item.saleItemId, item.displayQuantity + 1)}
            className="rounded-full w-7 h-7 border bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition"
          >
            +
          </button>
        </div>
        
        {hasDerivedUnits ? (
            <Select 
                value={item.displayUnit}
                onValueChange={(newUnit) => onUpdateQuantity(item.saleItemId, item.displayQuantity, newUnit)}
            >
                <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                    {allUnits.map(u => (
                        <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : (
            <span className="text-sm text-gray-500 px-3">{item.units.baseUnit}</span>
        )}

        <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8"
            onClick={() => onUpdateQuantity(item.saleItemId, 0)} // Setting quantity to 0 removes it
        >
            <Trash2 className="h-4 w-4"/>
        </Button>
      </div>
      
      {/* Bottom section: Discounts */}
      <div className="mt-3 border-t border-dashed pt-3">
        {isCalculating ? (
            <div className='space-y-2'>
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
            </div>
        ) : hasDiscounts && lineItemResult ? (
          <div className="mb-2 space-y-1">
             <div className="font-bold text-sm text-green-900 mb-2 flex justify-between items-center">
                <span>Applied Discounts:</span>
                <Button variant="outline" size="sm" className="h-7" onClick={() => onOverrideDiscount(item)}>
                    <Tag className="mr-2 h-3 w-3" />
                    Override
                </Button>
             </div>
             {isCustomDiscount && item.customDiscountType && (
                 <p className="flex justify-between items-center text-xs bg-yellow-50 text-yellow-800 p-2 rounded-md">
                    <span className="font-bold truncate pr-2">Manual Override</span>
                    <span className="font-semibold bg-yellow-200 px-2 py-0.5 rounded-full">
                        {item.customDiscountType === 'percentage' ? `${item.customDiscountValue}%` : `Rs. ${item.customDiscountValue}`}
                    </span>
                 </p>
             )}
             {!isCustomDiscount && lineItemResult.appliedRules.map((rule: any, i: number) => (
                <p key={i} className="flex justify-between items-center text-xs">
                    <span className="truncate pr-2">{rule.appliedRuleInfo.sourceRuleName}</span>
                    <span className="font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">-Rs. {rule.discountAmount.toFixed(2)}</span>
                </p>
             ))}
          </div>
        ) : (
            <div className="flex justify-end">
                 <Button variant="outline" size="sm" className="h-7" onClick={() => onOverrideDiscount(item)}>
                    <Tag className="mr-2 h-3 w-3" />
                    Add Discount
                </Button>
            </div>
        )}

        <div className="flex justify-between items-baseline text-xs mt-2">
           <span className="text-gray-500">
            Total Base Qty: {item.quantity.toFixed(2)} {item.units.baseUnit}
          </span>
          {isCalculating ? (
             <Skeleton className="h-4 w-20" />
          ) : hasDiscounts && (
             <span className="text-gray-500 line-through">
                Original: Rs. {originalLineTotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
