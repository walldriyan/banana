// src/components/POSUI/CartItemCard.tsx
import React from 'react';
import type { SaleItem } from '@/types';
// import type { DiscountResult } from '@/discount-engine/core/result';

interface CartItemCardProps {
  item: SaleItem;
  discountResult: any; // Using any because it's a plain object from server, not a class instance
  onUpdateQuantity: (saleItemId: string, change: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, discountResult, onUpdateQuantity }) => {

  const lineItemResult = (discountResult && discountResult.lineItems)
    ? discountResult.lineItems.find((li: any) => li.lineId === item.saleItemId)
    : undefined;

  const hasDiscounts = lineItemResult && lineItemResult.totalDiscount > 0;
  const originalLineTotal = item.price * item.quantity;
  const finalLineTotal = lineItemResult ? originalLineTotal - lineItemResult.totalDiscount : originalLineTotal;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 ease-in-out">
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
          <p className="text-sm text-gray-600">Rs. {item.price.toFixed(2)} / unit</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.saleItemId, -1)}
            className="rounded-full w-7 h-7 border bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition"
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.saleItemId, 1)}
            className="rounded-full w-7 h-7 border bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="mt-3 border-t border-dashed pt-3">
        {hasDiscounts && lineItemResult && (
          <div className="mb-2 text-xs text-green-800 space-y-1">
             <div className="font-bold text-green-900 mb-1">Applied Discounts:</div>
            {lineItemResult.appliedRules.map((rule: any, i: number) => (
              <p key={i} className="flex justify-between items-center">
                <span className="truncate pr-2">{rule.appliedRuleInfo.sourceRuleName}</span>
                <span className="font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">-Rs. {rule.discountAmount.toFixed(2)}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex justify-between items-baseline text-sm">
          <span className={hasDiscounts ? "text-gray-500 line-through" : "text-gray-600 font-semibold"}>
            Original Total: Rs. {originalLineTotal.toFixed(2)}
          </span>
          {hasDiscounts && (
            <span className="font-bold text-lg text-green-700">
              Our Price: Rs. {finalLineTotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
