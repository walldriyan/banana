// src/components/POSUI/CartItemCard.tsx
import React from 'react';
import type { SaleItem } from '@/types';
import type { LineItemResult } from '@/discount-engine/core/result';

interface CartItemCardProps {
  item: SaleItem;
  discountResult: LineItemResult | undefined;
  onUpdateQuantity: (saleItemId: string, change: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, discountResult, onUpdateQuantity }) => {
  const hasDiscounts = discountResult && discountResult.appliedRules && discountResult.appliedRules.length > 0;

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
      {hasDiscounts && (
        <div className="mt-3 text-xs text-green-800 space-y-1">
          <div className="border-t border-dashed border-green-200 pt-2">
             <div className="font-bold text-green-900 mb-1">Applied Discounts:</div>
            {discountResult.appliedRules.map((rule, i) => (
              <p key={i} className="flex justify-between items-center">
                <span className="truncate pr-2">{rule.appliedRuleInfo.sourceRuleName}</span>
                <span className="font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">-Rs. {rule.discountAmount.toFixed(2)}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItemCard;